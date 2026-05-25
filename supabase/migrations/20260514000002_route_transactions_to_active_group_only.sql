-- PHASE 1: Active Group Routing Hardening (Backend Trigger = Single Routing Owner)
-- Scope: Replace auto-mapping trigger to route ONLY to user_preferences.active_group_id.
-- Preserve: no-backfill (tx.date >= group.created_at), idempotency, offline-first.
-- Observability: lightweight forensic tag in notes + deterministic idempotency_key.

CREATE OR REPLACE FUNCTION public.handle_transaction_auto_group_mapping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_group_id uuid;
  v_group_created_at timestamptz;
  v_member_id uuid;
  v_idempotency_key text;
  v_source_ref text;
  v_notes text;
BEGIN
  -- Only process expenses (not income)
  IF NEW.type != 'expense' THEN
    RETURN NEW;
  END IF;

  -- Resolve routing target (ONLY active_group_id). If missing, route nowhere (safer than wrong group).
  SELECT active_group_id
    INTO v_active_group_id
  FROM public.user_preferences
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_active_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Membership validation: prevent corruption if active_group_id is stale.
  SELECT id
    INTO v_member_id
  FROM public.group_members
  WHERE group_id = v_active_group_id
    AND user_id = NEW.user_id
  LIMIT 1;

  IF v_member_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No-backfill: do not route transactions before group creation
  SELECT created_at
    INTO v_group_created_at
  FROM public.groups
  WHERE id = v_active_group_id
  LIMIT 1;

  IF v_group_created_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.date < v_group_created_at THEN
    RETURN NEW;
  END IF;

  -- Deterministic idempotency keys (duplicate prevention under retry/replay)
  IF NEW.sms_hash IS NOT NULL THEN
    v_idempotency_key := 'AUTO_SMS:' || NEW.sms_hash || ':' || v_active_group_id::text;
    v_source_ref := 'sms:' || NEW.sms_hash;
  ELSE
    v_idempotency_key := 'AUTO_TX:' || NEW.id::text || ':' || v_active_group_id::text;
    v_source_ref := 'tx:' || NEW.id::text;
  END IF;

  -- Lightweight forensic observability (success-path only)
  v_notes := '[ROUTE:v1 owner=TRIGGER ag=' || v_active_group_id::text || ' src=' || v_source_ref || '] (Auto-Linked via Backend)';

  -- Atomic insert into group ledger (RPC handles idempotency & split generation)
  PERFORM public.insert_group_expense_with_split(
    p_group_id := v_active_group_id,
    p_user_id := NEW.user_id,
    p_title := COALESCE(NEW.description, 'Transaction'),
    p_amount := NEW.amount,
    p_paid_by_member_id := v_member_id,
    p_split_type := 'equal',
    p_category := COALESCE(NEW.category, 'Others'),
    p_notes := v_notes,
    p_splits := NULL,
    p_idempotency_key := v_idempotency_key,
    p_date := NEW.date,
    p_id := NULL
  );

  RETURN NEW;
END;
$$;

-- Ensure trigger is attached (idempotent)
DROP TRIGGER IF EXISTS on_transaction_insert_map_group ON public.transactions;
CREATE TRIGGER on_transaction_insert_map_group
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_transaction_auto_group_mapping();

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

