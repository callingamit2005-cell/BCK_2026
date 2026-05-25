
-- Phase 3: Backend Fix
-- Description: Perfected RPC for group expenses with duplicate prevention and validation.

CREATE OR REPLACE FUNCTION public.insert_group_expense_with_split(
    p_group_id uuid,
    p_user_id uuid,
    p_title text,
    p_amount numeric,
    p_paid_by_member_id uuid,
    p_split_type text DEFAULT 'equal',
    p_category text DEFAULT 'Others',
    p_notes text DEFAULT NULL,
    p_date timestamp with time zone DEFAULT now(),
    p_splits jsonb DEFAULT NULL -- Changed from p_custom_splits to p_splits to match frontend
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense_id uuid;
    v_member_count int;
    v_share_amount numeric;
    v_remainder numeric;
    v_member_record record;
    v_payer_name text;
    v_total_split_sum numeric := 0;
    v_current_share numeric;
    v_split_item jsonb;
    v_target_user_id uuid;
    v_target_member_id uuid;
    v_split_verify_count int;
BEGIN
    -- 🛡️ 1. Resolve Payer Name and Verify Membership
    SELECT name INTO v_payer_name FROM public.group_members WHERE id = p_paid_by_member_id AND group_id = p_group_id;
    IF v_payer_name IS NULL THEN
        RAISE EXCEPTION 'Payer member % not found in group %', p_paid_by_member_id, p_group_id;
    END IF;

    -- 🛡️ 2. Insert main expense
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
        v_payer_name
    )
    RETURNING id INTO v_expense_id;

    -- 🛡️ 3. Handle Splits
    IF p_split_type = 'equal' THEN
        -- For equal splits, we calculate server-side to ensure 100% accuracy
        SELECT count(*) INTO v_member_count FROM public.group_members WHERE group_id = p_group_id;
        
        IF v_member_count = 0 THEN
            RAISE EXCEPTION 'Cannot split: No members found in group %', p_group_id;
        END IF;

        v_share_amount := floor(p_amount / v_member_count);
        v_remainder := p_amount - (v_share_amount * v_member_count);

        -- Insert splits exactly once per member
        FOR v_member_record IN (SELECT id, user_id FROM public.group_members WHERE group_id = p_group_id) LOOP
            v_current_share := v_share_amount;
            
            -- Payer covers the remainder
            IF v_member_record.id = p_paid_by_member_id THEN
                v_current_share := v_current_share + v_remainder;
            END IF;

            -- Check for existing split to prevent duplicates before insertion
            IF EXISTS (SELECT 1 FROM public.expense_splits WHERE expense_id = v_expense_id AND user_id = v_member_record.user_id) THEN
                RAISE EXCEPTION 'Duplicate split detected for user %', v_member_record.user_id;
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

    ELSIF p_split_type = 'unequal' AND p_splits IS NOT NULL THEN
        -- Handle provided splits array: [{ "user_id": "...", "share_amount": 100 }] or [{ "member_id": "...", "share_amount": 100 }]
        FOR v_split_item IN SELECT * FROM jsonb_array_elements(p_splits) LOOP
            v_target_user_id := (v_split_item->>'user_id')::uuid;
            v_target_member_id := (v_split_item->>'member_id')::uuid;
            v_current_share := (v_split_item->>'share_amount')::numeric;
            v_total_split_sum := v_total_split_sum + v_current_share;

            -- Resolve missing IDs
            IF v_target_user_id IS NULL AND v_target_member_id IS NOT NULL THEN
                SELECT user_id INTO v_target_user_id FROM public.group_members WHERE id = v_target_member_id;
            ELSIF v_target_member_id IS NULL AND v_target_user_id IS NOT NULL THEN
                SELECT id INTO v_target_member_id FROM public.group_members 
                WHERE user_id = v_target_user_id AND group_id = p_group_id;
            END IF;

            IF v_target_member_id IS NULL OR v_target_user_id IS NULL THEN
                RAISE EXCEPTION 'Member or User not found in group % for split item %', p_group_id, v_split_item;
            END IF;

            -- Strict Duplicate Check
            IF EXISTS (SELECT 1 FROM public.expense_splits WHERE expense_id = v_expense_id AND user_id = v_target_user_id) THEN
                RAISE EXCEPTION 'Duplicate split detected for user % in unequal split', v_target_user_id;
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
                v_target_member_id,
                v_target_user_id,
                v_current_share,
                COALESCE(p_date, now())
            );
        END LOOP;

        -- Validate sum matches total amount
        IF ABS(v_total_split_sum - p_amount) > 1 THEN
            RAISE EXCEPTION 'Split mismatch: Total % != Sum %', p_amount, v_total_split_sum;
        END IF;

    ELSE
        RAISE EXCEPTION 'Invalid split type or missing splits data';
    END IF;

    -- 🛡️ 4. FINAL VERIFICATION
    SELECT count(*) INTO v_split_verify_count FROM public.expense_splits WHERE expense_id = v_expense_id;
    IF v_split_verify_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL: Splits failed to generate for expense %', v_expense_id;
    END IF;

    RETURN v_expense_id;
END;
$$;
