
-- Add split_type, notes, paid_by_member_id to group_expenses
ALTER TABLE public.group_expenses ADD COLUMN IF NOT EXISTS split_type text NOT NULL DEFAULT 'equal';
ALTER TABLE public.group_expenses ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.group_expenses ADD COLUMN IF NOT EXISTS paid_by_member_id uuid REFERENCES public.group_members(id) ON DELETE SET NULL;

-- Add member_id to expense_splits for tracking which member a split belongs to
ALTER TABLE public.expense_splits ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.group_members(id) ON DELETE CASCADE;

-- expense_splits currently only has SELECT policy. Add INSERT, UPDATE, DELETE policies.
CREATE POLICY "Users can insert expense splits"
ON public.expense_splits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete expense splits"
ON public.expense_splits FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update expense splits"
ON public.expense_splits FOR UPDATE
USING (auth.uid() = user_id);
