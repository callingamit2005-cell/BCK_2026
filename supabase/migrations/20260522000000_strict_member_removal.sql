-- 🛠️ Phase 28: Strict Member Removal & Ledger Integrity
-- Purpose: Implement safe member removal rules as per enterprise mandates.
-- 1. Permanent removal for members without history.
-- 2. Prevention of deletion for members with financial footprints.

CREATE OR REPLACE FUNCTION public.archive_group_member_atomic(p_member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id uuid;
    v_is_admin boolean;
    v_has_expenses boolean;
    v_has_splits boolean;
    v_has_settlements boolean;
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
        RETURN jsonb_build_object('success', false, 'reason', 'Unauthorized: Only admins can remove members');
    END IF;

    -- 3. Check for financial history (Transactions, Splits, Settlements)
    SELECT EXISTS (SELECT 1 FROM public.group_expenses WHERE paid_by_member_id = p_member_id) INTO v_has_expenses;
    SELECT EXISTS (SELECT 1 FROM public.expense_splits WHERE member_id = p_member_id) INTO v_has_splits;
    SELECT EXISTS (SELECT 1 FROM public.settlement_intents WHERE sender_id = p_member_id OR receiver_id = p_member_id) INTO v_has_settlements;

    -- 4. Execute Removal Rules
    IF v_has_expenses OR v_has_splits OR v_has_settlements THEN
        -- Rule: If financial history exists, prevent deletion to preserve ledger integrity.
        RETURN jsonb_build_object(
            'success', false, 
            'reason', 'Cannot remove member: Financial history exists. Ledger integrity must be preserved.'
        );
    ELSE
        -- Rule: If NO history exists, we still perform a SOFT-DELETE to match the "(Departed)" UI state
        -- which is verified as the correct behavioral state for BachatKaro.
        UPDATE public.group_members 
        SET is_deleted = true 
        WHERE id = p_member_id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Member safely archived.'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION public.archive_group_member_atomic(uuid) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
