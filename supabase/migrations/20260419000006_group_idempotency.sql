
-- Migration: add_idempotency_to_group_expenses
-- Description: Adds idempotency_key to group_expenses and updates the RPC to support it.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_expenses' AND column_name = 'idempotency_key') THEN
        ALTER TABLE public.group_expenses ADD COLUMN idempotency_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_group_idempotency') THEN
        ALTER TABLE public.group_expenses ADD CONSTRAINT unique_group_idempotency UNIQUE (user_id, idempotency_key);
    END IF;
END $$;

-- Update RPC to include p_idempotency_key
CREATE OR REPLACE FUNCTION public.insert_group_expense_with_split(
    p_group_id uuid,
    p_title text,
    p_amount numeric,
    p_paid_by_member_id uuid,
    p_user_id uuid,
    p_split_type text,
    p_splits jsonb,
    p_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense_id uuid;
    v_split RECORD;
BEGIN
    -- 🔒 1. AUTH CHECK
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;

    -- 🔒 2. GROUP MEMBERSHIP CHECK
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = p_group_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this group';
    END IF;

    -- 3. IDEMPOTENCY CHECK (LATEST WINS / PREVENT DUPLICATES)
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_expense_id FROM public.group_expenses 
        WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
        
        IF v_expense_id IS NOT NULL THEN
            RETURN v_expense_id; -- Already exists, return existing ID
        END IF;
    END IF;

    -- 4. INSERT MAIN EXPENSE
    INSERT INTO public.group_expenses (
        group_id,
        title,
        amount,
        paid_by,
        user_id,
        idempotency_key,
        created_at
    )
    VALUES (
        p_group_id,
        p_title,
        p_amount,
        p_paid_by_member_id::text,
        p_user_id,
        p_idempotency_key,
        NOW()
    )
    RETURNING id INTO v_expense_id;

    -- 5. INSERT SPLITS
    FOR v_split IN
        SELECT * FROM jsonb_to_recordset(p_splits)
        AS (user_id uuid, share_amount numeric)
    LOOP
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
        )
        ON CONFLICT (expense_id, user_id) DO NOTHING;
    END LOOP;

    RETURN v_expense_id;
END;
$$;
