-- 1. Restrict waitlist_users RLS
DROP POLICY IF EXISTS "Allow anonymous waitlist email lookup" ON public.waitlist_users;

-- Admin-only policy for waitlist users (optional but restrictive)
CREATE POLICY "Waitlist accessible to admins only"
  ON public.waitlist_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  );

-- 2. Ensure all critical indexes are applied
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_emis_user ON emis(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_trip_plans_user ON trip_plans(user_id);

-- 3. Create RPC for financial calculations
CREATE OR REPLACE FUNCTION get_bachat_data_stats(p_user_id UUID, p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
  total_spent DECIMAL,
  monthly_spent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_spent,
    COALESCE(SUM(CASE 
      WHEN EXTRACT(MONTH FROM created_at AT TIME ZONE 'UTC') = p_month 
       AND EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC') = p_year 
      THEN amount 
      ELSE 0 
    END), 0) as monthly_spent
  FROM expenses
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
