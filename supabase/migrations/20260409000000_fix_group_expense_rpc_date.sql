
-- Migration: fix_group_expense_rpc_date_and_sync
-- Description: Adds p_date parameter to insert_group_expense_with_split and ensures correct timestamping.

CREATE OR REPLACE FUNCTION public.insert_group_expense_with_split(
    p_group_id uuid,
    p_user_id uuid,
    p_title text,
    p_amount numeric,
    p_paid_by_member_id uuid,
    p_split_type text DEFAULT 'equal',
    p_category text DEFAULT 'Others',
    p_notes text DEFAULT NULL,
    p_date timestamp with time zone DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense_id uuid;
    v_member_count int;
    v_share_amount numeric;
    v_member_record record;
    v_payer_name text;
BEGIN
    -- 0. Resolve Payer Name for backward compatibility
    SELECT name INTO v_payer_name FROM public.group_members WHERE id = p_paid_by_member_id;

    -- 1. Insert the main expense record with explicit p_date
    INSERT INTO public.group_expenses (
        group_id,
        user_id,
        title,
        amount,
        paid_by_member_id,
        split_type,
        category,
        notes,
        created_at,
        paid_by
    )
    VALUES (
        p_group_id,
        p_user_id,
        p_title,
        p_amount,
        p_paid_by_member_id,
        p_split_type,
        p_category,
        p_notes,
        COALESCE(p_date, now()),
        COALESCE(v_payer_name, 'Unknown')
    )
    RETURNING id INTO v_expense_id;

    -- 2. Handle Splits (Default: Equal)
    IF p_split_type = 'equal' THEN
        SELECT count(*) INTO v_member_count FROM public.group_members WHERE group_id = p_group_id;
        
        IF v_member_count > 0 THEN
            v_share_amount := p_amount / v_member_count;
            
            FOR v_member_record IN (SELECT id, user_id FROM public.group_members WHERE group_id = p_group_id) LOOP
                INSERT INTO public.expense_splits (
                    expense_id,
                    group_id,
                    member_id,
                    user_id,
                    share_amount,
                    created_at
                )
                VALUES (
                    v_expense_id,
                    p_group_id,
                    v_member_record.id,
                    p_user_id, 
                    v_share_amount,
                    COALESCE(p_date, now())
                );
            END LOOP;
        END IF;
    END IF;

    RETURN v_expense_id;
END;
$$;
