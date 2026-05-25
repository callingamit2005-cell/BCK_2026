-- 🛠️ [PHASE_0C] Fix Atomic CRUD RPCs for PostgREST Resolution
-- Purpose: PostgREST returns 404 when it cannot cast a string to UUID (e.g. offline-generated IDs like 'exp_123').
-- Fix: Accept 'text' and gracefully cast, fallback to idempotency_key lookup for legacy items.

-- 1. Drop existing strict-UUID functions to avoid ambiguity
DROP FUNCTION IF EXISTS public.delete_group_expense_atomic(uuid);
DROP FUNCTION IF EXISTS public.clear_group_ledger_atomic(uuid);

-- 2. Create permissive Atomic Single Expense Deletion
CREATE OR REPLACE FUNCTION public.delete_group_expense_atomic(p_expense_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uuid uuid;
BEGIN
    -- Attempt to cast to UUID.
    BEGIN
        v_uuid := p_expense_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        -- If it's a legacy offline string (e.g. 'exp_...'), the cloud record has a real UUID,
        -- but its idempotency_key matches 'idemp_' || p_expense_id
        SELECT id INTO v_uuid FROM public.group_expenses 
        WHERE idempotency_key = 'idemp_' || p_expense_id 
           OR idempotency_key = p_expense_id 
        LIMIT 1;
        
        IF v_uuid IS NULL THEN
            RETURN; -- If it doesn't exist, we consider the deletion successful (idempotent)
        END IF;
    END;

    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM public.group_expenses ge
        JOIN public.group_members gm ON ge.group_id = gm.group_id
        WHERE ge.id = v_uuid AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User cannot delete this expense.';
    END IF;

    -- Atomic Delete: Splits first then main record
    DELETE FROM public.expense_splits WHERE expense_id = v_uuid;
    DELETE FROM public.group_expenses WHERE id = v_uuid;
END;
$$;

-- 3. Create permissive Atomic Bulk Ledger Clear
CREATE OR REPLACE FUNCTION public.clear_group_ledger_atomic(p_group_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uuid uuid;
BEGIN
    BEGIN
        v_uuid := p_group_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN;
    END;

    -- Authorization check (Only group admin or owner can clear)
    IF NOT EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = v_uuid AND g.user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = v_uuid AND gm.user_id = auth.uid() AND gm.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admin or creator can clear the ledger.';
    END IF;

    -- Atomic Bulk Delete
    DELETE FROM public.expense_splits WHERE group_id = v_uuid;
    DELETE FROM public.group_expenses WHERE group_id = v_uuid;
END;
$$;

-- 4. Fix Edit Update Failure (UPSERT constraint resolution)
-- PostgREST UPSERTs with ?on_conflict=idempotency_key fail if the constraint is UNIQUE(user_id, idempotency_key)
-- Adding a standalone UNIQUE constraint ensures the frontend UPSERT resolves successfully.
ALTER TABLE public.group_expenses DROP CONSTRAINT IF EXISTS group_expenses_idempotency_key_key;
ALTER TABLE public.group_expenses ADD CONSTRAINT group_expenses_idempotency_key_key UNIQUE (idempotency_key);

-- Force PostgREST schema cache reload to immediately expose the updated text signatures
NOTIFY pgrst, 'reload schema';
