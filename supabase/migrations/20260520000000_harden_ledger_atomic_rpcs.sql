-- 🛠️ Phase 4: Critical Security Hardening for Atomic RPCs
-- Purpose: Restore strict authorization checks to SECURITY DEFINER functions.
-- Verified: Admin can delete any, member can delete only own, non-member cannot delete.

-- 1. Harden Atomic Single Expense Deletion
CREATE OR REPLACE FUNCTION public.delete_group_expense_atomic(p_expense_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uuid uuid;
    v_group_id uuid;
    v_expense_user_id uuid;
BEGIN
    -- 🔒 Mandatory Auth Guard
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- 🛡️ Resolve UUID and Metadata (Handles both UUID and Legacy IDs)
    BEGIN
        v_uuid := p_expense_id::uuid;
        
        SELECT group_id, user_id INTO v_group_id, v_expense_user_id 
        FROM public.group_expenses 
        WHERE id = v_uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        -- Fallback for offline-generated legacy IDs stored via idempotency_key
        SELECT id, group_id, user_id INTO v_uuid, v_group_id, v_expense_user_id 
        FROM public.group_expenses 
        WHERE idempotency_key = 'idemp_' || p_expense_id 
           OR idempotency_key = p_expense_id 
        LIMIT 1;
    END;
    
    -- If no record found, exit gracefully (idempotent behavior for sync queue)
    IF v_uuid IS NULL THEN
        RETURN;
    END IF;

    -- 🔒 STRICT AUTHORIZATION CHECK
    -- Allow if:
    -- 1. User is the Group Creator (Owner)
    -- 2. User is a Group Admin (role = 'admin')
    -- 3. User is the Expense Owner (creator of this specific expense)
    IF NOT EXISTS (
        -- Check Group Ownership/Admin status
        SELECT 1 FROM public.groups g
        LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.user_id = auth.uid()
        WHERE g.id = v_group_id AND (g.user_id = auth.uid() OR gm.role = 'admin')
    ) AND (v_expense_user_id IS NULL OR v_expense_user_id != auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admins or the expense owner can delete this record.';
    END IF;

    -- Atomic Delete: Splits first then main record to maintain referential integrity
    DELETE FROM public.expense_splits WHERE expense_id = v_uuid;
    DELETE FROM public.group_expenses WHERE id = v_uuid;
END;
$$;

-- 2. Harden Atomic Bulk Ledger Clear
CREATE OR REPLACE FUNCTION public.clear_group_ledger_atomic(p_group_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uuid uuid;
BEGIN
    -- 🔒 Mandatory Auth Guard
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- 🛡️ Resolve Group UUID
    BEGIN
        v_uuid := p_group_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        -- Legacy IDs not supported for bulk clear, exit gracefully
        RETURN;
    END;

    -- 🔒 STRICT AUTHORIZATION CHECK
    -- Allow ONLY if:
    -- 1. User is the Group Creator (Owner)
    -- 2. User is a Group Admin (role = 'admin')
    -- Members who are not admins CANNOT clear the ledger.
    IF NOT EXISTS (
        SELECT 1 FROM public.groups g
        LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.user_id = auth.uid()
        WHERE g.id = v_uuid AND (g.user_id = auth.uid() OR gm.role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admins or the creator can clear the ledger.';
    END IF;

    -- Atomic Bulk Delete: Maintains integrity across both ledger tables
    DELETE FROM public.expense_splits WHERE group_id = v_uuid;
    DELETE FROM public.group_expenses WHERE group_id = v_uuid;
END;
$$;

-- 3. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
