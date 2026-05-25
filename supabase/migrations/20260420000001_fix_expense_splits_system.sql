
-- BachatKaro Group Expense & Split System Fix
-- Phase 2: Database Integrity Hardening

-- 1. Remove duplicate members
DELETE FROM public.group_members
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM public.group_members
    GROUP BY group_id, user_id
);

-- 2. Add constraint to prevent future duplicate members
ALTER TABLE public.group_members 
DROP CONSTRAINT IF EXISTS unique_group_user;

ALTER TABLE public.group_members
ADD CONSTRAINT unique_group_user UNIQUE (group_id, user_id);

-- 3. Remove duplicate splits
DELETE FROM public.expense_splits
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM public.expense_splits
    GROUP BY expense_id, user_id
);

-- 4. Add constraint to prevent future duplicate splits
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS unique_expense_user;

ALTER TABLE public.expense_splits
ADD CONSTRAINT unique_expense_user UNIQUE (expense_id, user_id);

-- Phase 3: Backend RPC Fix (insert_group_expense_with_split)
CREATE OR REPLACE FUNCTION public.insert_group_expense_with_split(
    p_group_id uuid,
    p_user_id uuid,
    p_title text,
    p_amount numeric,
    p_paid_by_member_id uuid,
    p_split_type text DEFAULT 'equal',
    p_category text DEFAULT 'Others',
    p_notes text DEFAULT NULL,
    p_splits jsonb DEFAULT NULL,
    p_idempotency_key text DEFAULT NULL,
    p_date timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expense_id uuid;
    v_split RECORD;
    v_payer_name text;
    v_target_member_id uuid;
    v_user_count int;
BEGIN
    -- 🔒 1. AUTH & MEMBERSHIP CHECK
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = p_group_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this group';
    END IF;

    -- 🔒 2. IDEMPOTENCY CHECK
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_expense_id FROM public.group_expenses 
        WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
        
        IF v_expense_id IS NOT NULL THEN
            RETURN v_expense_id; 
        END IF;
    END IF;

    -- 🛡️ 3. RESOLVE PAYER NAME
    SELECT name INTO v_payer_name FROM public.group_members WHERE id = p_paid_by_member_id;

    -- 🛡️ 4. INSERT MAIN EXPENSE
    INSERT INTO public.group_expenses (
        group_id,
        user_id,
        title,
        amount,
        paid_by,
        paid_by_member_id,
        split_type,
        category,
        notes,
        idempotency_key,
        created_at
    )
    VALUES (
        p_group_id,
        p_user_id,
        p_title,
        p_amount,
        COALESCE(v_payer_name, p_paid_by_member_id::text),
        p_paid_by_member_id,
        p_split_type,
        p_category,
        p_notes,
        p_idempotency_key,
        COALESCE(p_date, now())
    )
    RETURNING id INTO v_expense_id;

    -- 🛡️ 5. INSERT SPLITS (STRICT VALIDATION)
    IF p_splits IS NOT NULL AND jsonb_array_length(p_splits) > 0 THEN
        -- Check for duplicate user_ids in the payload
        SELECT count(DISTINCT (x->>'user_id')) INTO v_user_count
        FROM jsonb_array_elements(p_splits) x;

        IF v_user_count != jsonb_array_length(p_splits) THEN
            RAISE EXCEPTION 'Duplicate user_id found in splits payload';
        END IF;

        FOR v_split IN
            SELECT * FROM jsonb_to_recordset(p_splits)
            AS (user_id uuid, share_amount numeric)
        LOOP
            -- Resolve member_id for data consistency
            SELECT id INTO v_target_member_id FROM public.group_members 
            WHERE group_id = p_group_id AND user_id = v_split.user_id;

            INSERT INTO public.expense_splits (
                expense_id,
                group_id,
                user_id,
                member_id,
                share_amount,
                created_at
            )
            VALUES (
                v_expense_id,
                p_group_id,
                v_split.user_id,
                v_target_member_id,
                v_split.share_amount,
                COALESCE(p_date, now())
            );
            -- NO ON CONFLICT UPDATE HERE -> New expense, splits must be unique
        END LOOP;
    ELSIF p_split_type = 'equal' THEN
        -- AUTO-GENERATE EQUAL SPLITS
        DECLARE
            v_member_count int;
            v_share_amount numeric;
            v_remainder numeric;
            v_member_record record;
            v_current_share numeric;
        BEGIN
            SELECT count(*) INTO v_member_count FROM public.group_members WHERE group_id = p_group_id;

            IF v_member_count > 0 THEN
                v_share_amount := floor(p_amount / v_member_count);
                v_remainder := p_amount - (v_share_amount * v_member_count);

                FOR v_member_record IN (SELECT id, user_id FROM public.group_members WHERE group_id = p_group_id) LOOP
                    v_current_share := v_share_amount;
                    
                    -- Payer covers the remainder
                    IF v_member_record.id = p_paid_by_member_id THEN
                        v_current_share := v_current_share + v_remainder;
                    END IF;

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
                        v_member_record.user_id,
                        v_current_share,
                        COALESCE(p_date, now())
                    );
                END LOOP;
            END IF;
        END;
    END IF;

    RETURN v_expense_id;
END;
$$;
