
-- Migration: auto_group_mapping_trigger
-- Description: Automatically maps new transactions to the user's default group via a database trigger.
-- This ensures background-synced SMS transactions are also auto-mapped to groups.

CREATE OR REPLACE FUNCTION public.handle_transaction_auto_group_mapping()
RETURNS TRIGGER AS $$
DECLARE
    v_group_record RECORD;
    v_member_id uuid;
    v_ref_tag text;
    v_existing_id uuid;
BEGIN
    -- Only process expenses (not income)
    IF NEW.type != 'expense' THEN
        RETURN NEW;
    END IF;

    -- 1. Find the user's default group (first group they belong to)
    SELECT g.id, g.created_at INTO v_group_record
    FROM public.groups g
    JOIN public.group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = NEW.user_id
    ORDER BY g.created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- 2. Date Filter: Only map if transaction date is after group creation
    IF NEW.date < v_group_record.created_at THEN
        RETURN NEW;
    END IF;

    -- 3. Prevent Duplicates: ONLY if this is an SMS transaction (has hash)
    IF NEW.sms_hash IS NOT NULL THEN
        v_ref_tag := '[AUTO_SYNC:' || NEW.sms_hash || ']';
        
        SELECT id INTO v_existing_id
        FROM public.group_expenses
        WHERE group_id = v_group_record.id
          AND notes LIKE '%' || v_ref_tag || '%'
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RETURN NEW;
        END IF;
    ELSE
        v_ref_tag := '[MANUAL_SYNC:' || extract(epoch from now())::text || ']';
    END IF;

    -- 4. Resolve Member ID for the user in this group
    SELECT id INTO v_member_id
    FROM public.group_members
    WHERE group_id = v_group_record.id
      AND user_id = NEW.user_id
    LIMIT 1;

    IF v_member_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 5. Call Atomic RPC for Group Mapping
    PERFORM public.insert_group_expense_with_split(
        p_group_id := v_group_record.id,
        p_user_id := NEW.user_id,
        p_title := COALESCE(NEW.description, 'SMS Transaction'),
        p_amount := NEW.amount,
        p_paid_by_member_id := v_member_id,
        p_split_type := 'equal',
        p_category := COALESCE(NEW.category, 'Others'),
        p_notes := v_ref_tag || ' (Auto-Linked via Backend)',
        p_date := NEW.date
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to transactions table
DROP TRIGGER IF EXISTS on_transaction_insert_map_group ON public.transactions;
CREATE TRIGGER on_transaction_insert_map_group
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_transaction_auto_group_mapping();
