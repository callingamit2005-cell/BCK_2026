-- 🛠️ Phase 27: Immutable Member Archival Architecture
-- Purpose: Safely transition group_members to an append-only historical ledger architecture.

-- 1. ADD ARCHIVAL STATE COLUMN
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 2. HARDEN FOREIGN KEYS TO PREVENT HISTORICAL DATA LOSS
-- 2a. Hardening expense_splits (Prevents cascading splits deletion)
ALTER TABLE public.expense_splits DROP CONSTRAINT IF EXISTS expense_splits_member_id_fkey;
ALTER TABLE public.expense_splits ADD CONSTRAINT expense_splits_member_id_fkey 
    FOREIGN KEY (member_id) REFERENCES public.group_members(id) ON DELETE RESTRICT;

-- 2b. Hardening group_expenses (Prevents losing payer history)
ALTER TABLE public.group_expenses DROP CONSTRAINT IF EXISTS group_expenses_paid_by_member_id_fkey;
ALTER TABLE public.group_expenses ADD CONSTRAINT group_expenses_paid_by_member_id_fkey 
    FOREIGN KEY (paid_by_member_id) REFERENCES public.group_members(id) ON DELETE RESTRICT;

-- 3. ARCHIVAL RPC
-- Validates zero-balance and no pending settlements before archiving.
CREATE OR REPLACE FUNCTION public.archive_group_member_atomic(p_member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id uuid;
    v_is_admin boolean;
    v_total_paid numeric := 0;
    v_total_owed numeric := 0;
    v_balance numeric := 0;
    v_active_intents int;
BEGIN
    -- 1. Get member details
    SELECT group_id INTO v_group_id FROM public.group_members WHERE id = p_member_id;
    IF v_group_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Member not found');
    END IF;

    -- 2. Auth Guard: Caller must be admin of the group or the group owner
    SELECT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = v_group_id AND user_id = auth.uid() AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.groups WHERE id = v_group_id AND user_id = auth.uid()
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Unauthorized: Only admins can archive members');
    END IF;

    -- 3. Check Pending Settlements (Cannot archive if active settlements exist)
    SELECT count(*) INTO v_active_intents
    FROM public.settlement_intents
    WHERE (sender_id = p_member_id OR receiver_id = p_member_id)
    AND status IN ('created', 'redirected', 'pending_verification');

    IF v_active_intents > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Cannot remove member with pending settlements');
    END IF;

    -- 4. Calculate Net Balance
    -- Total Paid (Expenses paid by this member)
    SELECT COALESCE(sum(amount), 0) INTO v_total_paid 
    FROM public.group_expenses 
    WHERE group_id = v_group_id AND paid_by_member_id = p_member_id;

    -- Total Owed (Splits assigned to this member)
    SELECT COALESCE(sum(share_amount), 0) INTO v_total_owed 
    FROM public.expense_splits 
    WHERE group_id = v_group_id AND member_id = p_member_id;

    -- Net Balance = Total Paid - Total Owed
    v_balance := v_total_paid - v_total_owed;

    -- Strict zero balance check (allowing up to 0.01 fractional tolerance due to JS floating math on frontend, though DB is numeric)
    IF abs(v_balance) > 0.01 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Balance must be exactly zero before removal. Please settle all debts.');
    END IF;

    -- 5. Execute Archival (Soft Delete)
    UPDATE public.group_members 
    SET is_deleted = true 
    WHERE id = p_member_id;

    RETURN jsonb_build_object('success', true, 'message', 'Member safely archived');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.archive_group_member_atomic(uuid) TO authenticated;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
