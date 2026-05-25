-- 🛠️ [PHASE_0A] Group Ledger Atomic CRUD
-- Purpose: Ensure mathematical integrity and atomic consistency during ledger deletions.

-- 1. Atomic Single Expense Deletion
CREATE OR REPLACE FUNCTION public.delete_group_expense_atomic(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM public.group_expenses ge
        JOIN public.group_members gm ON ge.group_id = gm.group_id
        WHERE ge.id = p_expense_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User cannot delete this expense.';
    END IF;

    -- Atomic Delete: Splits first then main record
    DELETE FROM public.expense_splits WHERE expense_id = p_expense_id;
    DELETE FROM public.group_expenses WHERE id = p_expense_id;
END;
$$;

-- 2. Atomic Bulk Ledger Clear
CREATE OR REPLACE FUNCTION public.clear_group_ledger_atomic(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Authorization check (Only group admin or owner can clear)
    IF NOT EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = p_group_id AND g.user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admin or creator can clear the ledger.';
    END IF;

    -- Atomic Bulk Delete
    DELETE FROM public.expense_splits WHERE group_id = p_group_id;
    DELETE FROM public.group_expenses WHERE group_id = p_group_id;
END;
$$;
