
-- Migration: create_get_recent_transactions_rpc
-- Description: Unified RPC to fetch latest financial activity from both manual expenses and SMS transactions.
-- Correctly handles pagination and amount consistency.

CREATE OR REPLACE FUNCTION public.get_recent_transactions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    amount NUMERIC,
    type TEXT,
    category TEXT,
    description TEXT,
    date TIMESTAMPTZ,
    source TEXT,
    sms_hash TEXT
) AS $$
BEGIN
    RETURN QUERY
    (
        -- Manual Expenses
        SELECT 
            e.id::TEXT,
            e.amount,
            'expense' as type,
            e.category,
            COALESCE(e.note, 'Manual Expense') as description,
            e.created_at as date,
            'manual' as source,
            NULL as sms_hash
        FROM public.expenses e
        WHERE e.user_id = p_user_id

        UNION ALL

        -- Group Expenses
        SELECT 
            ge.id::TEXT,
            ge.amount,
            'expense' as type,
            ge.category,
            ge.title as description,
            ge.created_at as date,
            'group' as source,
            NULL as sms_hash
        FROM public.group_expenses ge
        WHERE ge.user_id = p_user_id

        UNION ALL

        -- SMS Transactions
        SELECT 
            t.id::TEXT,
            t.amount,
            t.type,
            t.category,
            t.description,
            t.date,
            'sms' as source,
            t.sms_hash
        FROM public.transactions t
        WHERE t.user_id = p_user_id
    )
    ORDER BY date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
