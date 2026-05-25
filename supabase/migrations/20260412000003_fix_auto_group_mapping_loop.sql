
-- Migration: fix_auto_group_mapping_loop
-- Description: Corrects the auto-mapping trigger to loop through ALL user groups instead of just the first one.
-- Logic: IF transaction.date >= group.created_at THEN INSERT into group_expenses

CREATE OR REPLACE FUNCTION public.handle_transaction_auto_group_mapping()
RETURNS TRIGGER AS $$
DECLARE
    v_group_record RECORD;
    v_member_id uuid;
    v_ref_tag text;
    v_existing_id uuid;
BEGIN
    -- Only process expenses (not income)
    IF NEW.type != 'expense' THEN
        RETURN NEW;
    END IF;

    -- FIX: Loop through EACH group the user belongs to
    FOR v_group_record IN 
        SELECT g.id, g.created_at 
        FROM public.groups g
        JOIN public.group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = NEW.user_id
    LOOP
        -- Logic: IF transaction.date >= group.created_at
        IF NEW.date >= v_group_record.created_at THEN
            
            -- Prevent Duplicates: ONLY if this is an SMS transaction (has hash)
            IF NEW.sms_hash IS NOT NULL THEN
                v_ref_tag := '[AUTO_SYNC:' || NEW.sms_hash || ']';
                
                SELECT id INTO v_existing_id
                FROM public.group_expenses
                WHERE group_id = v_group_record.id
                  AND notes LIKE '%' || v_ref_tag || '%'
                LIMIT 1;

                -- Skip this group if already mapped
                IF v_existing_id IS NOT NULL THEN
                    CONTINUE;
                END IF;
            ELSE
                v_ref_tag := '[MANUAL_SYNC:' || extract(epoch from now())::text || ']';
            END IF;

            -- Resolve Member ID for the user in this specific group
            SELECT id INTO v_member_id
            FROM public.group_members
            WHERE group_id = v_group_record.id
              AND user_id = NEW.user_id
            LIMIT 1;

            IF v_member_id IS NOT NULL THEN
                -- Insert into group_expenses (via Atomic RPC)
                PERFORM public.insert_group_expense_with_split(
                    p_group_id := v_group_record.id,
                    p_user_id := NEW.user_id,
                    p_title := COALESCE(NEW.description, 'SMS Transaction'),
                    p_amount := NEW.amount,
                    p_paid_by_member_id := v_member_id,
                    p_split_type := 'equal',
                    p_category := COALESCE(NEW.category, 'Others'),
                    p_notes := v_ref_tag || ' (Auto-Linked via Backend)',
                    p_date := NEW.date
                );
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
