
-- Phase 1: Database Fix
-- Step 1: Remove duplicate RPC functions
DROP FUNCTION IF EXISTS public.insert_group_expense_with_split(uuid, uuid, text, numeric, uuid, text, text, text, timestamp with time zone, jsonb);
DROP FUNCTION IF EXISTS public.insert_group_expense_with_split(uuid, uuid, text, numeric, uuid, text, text, text, timestamp with time zone);
DROP FUNCTION IF EXISTS public.insert_group_expense_with_split(uuid, text, numeric, uuid, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.insert_group_expense_with_split(uuid, text, numeric, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.insert_group_expense_with_split(uuid, text, numeric, uuid, uuid, text, jsonb);

-- Step 2: Create SINGLE CLEAN FUNCTION
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
    v_member RECORD;
BEGIN
    -- SAFETY CHECK
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be NULL';
    END IF;

    -- INSERT EXPENSE
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
        p_paid_by_member_id::text, -- Cast to text as paid_by is a string column
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_expense_id;

    -- INSERT SPLITS
    FOR v_member IN SELECT * FROM jsonb_to_recordset(p_splits)
    AS (user_id uuid, share_amount numeric)
    LOOP
        IF EXISTS (
            SELECT 1 FROM public.expense_splits
            WHERE expense_id = v_expense_id
            AND user_id = v_member.user_id
        ) THEN
            RAISE EXCEPTION 'Duplicate split detected';
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
            v_member.user_id,
            v_member.share_amount,
            NOW()
        );
    END LOOP;
END;
$$;

-- Step 3: ADD CONSTRAINTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_group_user') THEN
        ALTER TABLE public.group_members ADD CONSTRAINT unique_group_user UNIQUE (group_id, user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_expense_user') THEN
        ALTER TABLE public.expense_splits ADD CONSTRAINT unique_expense_user UNIQUE (expense_id, user_id);
    END IF;
END $$;
