
-- Add payment_mode column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_mode text;

-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can manage their own savings goals"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
