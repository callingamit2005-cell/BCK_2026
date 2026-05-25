
-- Migration: fix_stats_rpc_include_transactions
-- Description: Updates get_bachat_data_stats to include both manual expenses and SMS transactions.
-- This ensures the dashboard summary stats (Total Spent, Monthly Spent) are accurate.

CREATE OR REPLACE FUNCTION public.get_bachat_data_stats(p_user_id UUID, p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
  total_spent DECIMAL,
  monthly_spent DECIMAL
) AS $$
DECLARE
    v_total_expenses DECIMAL;
    v_monthly_expenses DECIMAL;
    v_total_transactions DECIMAL;
    v_monthly_transactions DECIMAL;
BEGIN
    -- 1. Calculate from manual expenses table
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(CASE 
            WHEN EXTRACT(MONTH FROM created_at AT TIME ZONE 'UTC') = p_month 
             AND EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC') = p_year 
            THEN amount 
            ELSE 0 
        END), 0)
    INTO v_total_expenses, v_monthly_expenses
    FROM public.expenses
    WHERE user_id = p_user_id;

    -- 2. Calculate from SMS transactions table (only expenses)
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(CASE 
            WHEN EXTRACT(MONTH FROM date AT TIME ZONE 'UTC') = p_month 
             AND EXTRACT(YEAR FROM date AT TIME ZONE 'UTC') = p_year 
            THEN amount 
            ELSE 0 
        END), 0)
    INTO v_total_transactions, v_monthly_transactions
    FROM public.transactions
    WHERE user_id = p_user_id AND type = 'expense';

    -- 3. Return combined stats
    RETURN QUERY
    SELECT 
        (v_total_expenses + v_total_transactions) as total_spent,
        (v_monthly_expenses + v_monthly_transactions) as monthly_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
