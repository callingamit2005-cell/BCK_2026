
-- Migration: fix_split_user_id
-- Description: Ensures each split in expense_splits uses the correct user_id of the group member.

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
    p_custom_splits jsonb DEFAULT NULL
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
    v_member_id uuid;
    v_split_verify_count int;
    v_member_user_id uuid;
BEGIN
    -- 🛡️ 1. Resolve Payer Name
    SELECT name INTO v_payer_name FROM public.group_members WHERE id = p_paid_by_member_id;

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
        COALESCE(v_payer_name, 'Unknown')
    )
    RETURNING id INTO v_expense_id;

    -- 🛡️ 3. Handle Splits (Equal)
    IF p_split_type = 'equal' THEN
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
        ELSE
            RAISE EXCEPTION 'No members found in group %', p_group_id;
        END IF;

    -- 🛡️ 4. Handle Splits (Unequal)
    ELSIF p_split_type = 'unequal' AND p_custom_splits IS NOT NULL THEN
        FOR v_member_id, v_current_share IN SELECT * FROM jsonb_each_text(p_custom_splits) LOOP
            v_total_split_sum := v_total_split_sum + v_current_share::numeric;
            
            -- Resolve user_id for each member in unequal split
            SELECT user_id INTO v_member_user_id FROM public.group_members WHERE id = v_member_id::uuid;

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
                v_member_id::uuid,
                COALESCE(v_member_user_id, p_user_id), -- Fallback to p_user_id if not found
                v_current_share::numeric,
                COALESCE(p_date, now())
            );
        END LOOP;

        IF v_total_split_sum != p_amount THEN
            RAISE EXCEPTION 'Split mismatch: Total % != sum of splits %', p_amount, v_total_split_sum;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid split type or missing custom splits';
    END IF;

    -- 🛡️ 5. CRITICAL VALIDATION: Ensure splits actually saved
    SELECT count(*) INTO v_split_verify_count FROM public.expense_splits WHERE expense_id = v_expense_id;
    
    IF v_split_verify_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL: Expense % created but splits failed to insert!', v_expense_id;
    END IF;

    RETURN v_expense_id;
END;
$$;
