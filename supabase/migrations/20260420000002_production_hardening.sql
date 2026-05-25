
-- BachatKaro Production Hardening Migration
-- 1. UNIQUE constraint on group_share_links.token (Safety Guard)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_share_links_token_key'
    ) THEN
        ALTER TABLE public.group_share_links ADD CONSTRAINT group_share_links_token_key UNIQUE (token);
    END IF;
END $$;

-- 2. ON CONFLICT DO NOTHING in group_members insert
-- Redefining join_group_safe for absolute race-condition safety
CREATE OR REPLACE FUNCTION public.join_group_safe(
    p_user_id uuid,
    p_group_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_name text;
BEGIN
    -- AUTH VALIDATION
    IF auth.uid() IS NULL THEN
        RETURN 'unauthorized';
    END IF;

    -- Basic existence check
    IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) THEN
        RETURN 'group_not_found';
    END IF;

    -- Get user metadata for the name
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Member')
    INTO v_user_name
    FROM auth.users WHERE id = p_user_id;

    -- RACE CONDITION SAFE INSERT
    INSERT INTO group_members (group_id, user_id, name, role)
    VALUES (p_group_id, p_user_id, v_user_name, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Return logic based on insertion success (FOUND is true if row was inserted)
    IF FOUND THEN
        RETURN 'joined';
    ELSE
        RETURN 'already_joined';
    END IF;
END;
$$;

-- 3. Backend validation for duplicate split user_ids
-- (Already implemented in insert_group_expense_with_split, adding more descriptive error)
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
    v_split_array_length int;
BEGIN
    -- 🔒 AUTH & MEMBERSHIP CHECK
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = p_group_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this group';
    END IF;

    -- 🔒 IDEMPOTENCY CHECK
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_expense_id FROM public.group_expenses 
        WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
        
        IF v_expense_id IS NOT NULL THEN
            RETURN v_expense_id; 
        END IF;
    END IF;

    -- 🛡️ RESOLVE PAYER NAME
    SELECT name INTO v_payer_name FROM public.group_members WHERE id = p_paid_by_member_id;

    -- 🛡️ INSERT MAIN EXPENSE
    INSERT INTO public.group_expenses (
        group_id, user_id, title, amount, paid_by, 
        paid_by_member_id, split_type, category, notes, idempotency_key, created_at
    )
    VALUES (
        p_group_id, p_user_id, p_title, p_amount, COALESCE(v_payer_name, p_paid_by_member_id::text),
        p_paid_by_member_id, p_split_type, p_category, p_notes, p_idempotency_key, COALESCE(p_date, now())
    )
    RETURNING id INTO v_expense_id;

    -- 🛡️ INSERT SPLITS (STRICT VALIDATION)
    IF p_splits IS NOT NULL AND jsonb_array_length(p_splits) > 0 THEN
        v_split_array_length := jsonb_array_length(p_splits);
        
        -- Check for duplicate user_ids in the payload
        SELECT count(DISTINCT (x->>'user_id')) INTO v_user_count
        FROM jsonb_array_elements(p_splits) x;

        IF v_user_count != v_split_array_length THEN
            RAISE EXCEPTION 'Integrity Error: Duplicate user_id detected in splits payload (% provided, % unique)', v_split_array_length, v_user_count;
        END IF;

        FOR v_split IN
            SELECT * FROM jsonb_to_recordset(p_splits)
            AS (user_id uuid, share_amount numeric)
        LOOP
            SELECT id INTO v_target_member_id FROM public.group_members 
            WHERE group_id = p_group_id AND user_id = v_split.user_id;

            INSERT INTO public.expense_splits (
                expense_id, group_id, user_id, member_id, share_amount, created_at
            )
            VALUES (
                v_expense_id, p_group_id, v_split.user_id, v_target_member_id, v_split.share_amount, COALESCE(p_date, now())
            );
        END LOOP;
    ELSIF p_split_type = 'equal' THEN
        -- (Auto-generate equal splits logic preserved as before)
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
                    IF v_member_record.id = p_paid_by_member_id THEN
                        v_current_share := v_current_share + v_remainder;
                    END IF;

                    INSERT INTO public.expense_splits (
                        expense_id, group_id, member_id, user_id, share_amount, created_at
                    )
                    VALUES (
                        v_expense_id, p_group_id, v_member_record.id, v_member_record.user_id, v_current_share, COALESCE(p_date, now())
                    );
                END LOOP;
            END IF;
        END;
    END IF;

    RETURN v_expense_id;
END;
$$;
