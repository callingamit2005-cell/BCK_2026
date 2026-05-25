
-- Phase 1: Backend Security Fix
-- Description: Hardens the group expense RPC with auth.uid() validation and membership checks.

CREATE OR REPLACE FUNCTION public.insert_group_expense_with_split(
    p_group_id uuid,
    p_title text,
    p_amount numeric,
    p_paid_by_member_id uuid,
    p_user_id uuid,
    p_split_type text,
    p_splits jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense_id uuid;
    v_split RECORD;
BEGIN
    -- 🔒 1. AUTH CHECK: Ensure payload p_user_id matches the session user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;

    -- 🔒 2. GROUP MEMBERSHIP CHECK: Ensure user is a member of the target group
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = p_group_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this group';
    END IF;

    -- 3. INSERT MAIN EXPENSE
    INSERT INTO public.group_expenses (
        group_id,
        title,
        amount,
        paid_by,
        user_id,
        created_at
    )
    VALUES (
        p_group_id,
        p_title,
        p_amount,
        p_paid_by_member_id::text,
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_expense_id;

    -- 4. INSERT SPLITS
    FOR v_split IN
        SELECT * FROM jsonb_to_recordset(p_splits)
        AS (user_id uuid, share_amount numeric)
    LOOP
        -- Defensive check within loop for duplicate splits per expense
        IF EXISTS (
            SELECT 1 FROM public.expense_splits
            WHERE expense_id = v_expense_id
            AND user_id = v_split.user_id
        ) THEN
            RAISE EXCEPTION 'Duplicate split detected for user %', v_split.user_id;
        END IF;

        INSERT INTO public.expense_splits (
            expense_id,
            group_id,
            user_id,
            share_amount,
            created_at
        )
        VALUES (
            v_expense_id,
            p_group_id,
            v_split.user_id,
            v_split.share_amount,
            NOW()
        );
    END LOOP;
END;
$$;
