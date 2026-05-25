
-- BachatKaro Secure Invite Join System Hardening
-- Description: Implement idempotent join functions and secure token validation.

-- PHASE 2: IDEMPOTENT JOIN FUNCTION
-- Hardens group joining with existence checks and clear return states.
CREATE OR REPLACE FUNCTION public.join_group_safe(
    p_user_id uuid,
    p_group_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_name text;
BEGIN
    -- PHASE 5: GROUP VALIDATION
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = p_group_id) THEN
        RETURN 'group_not_found';
    END IF;

    -- IDEMPOTENCY CHECK
    IF EXISTS (
        SELECT 1 FROM public.group_members
        WHERE user_id = p_user_id AND group_id = p_group_id
    ) THEN
        RETURN 'already_joined';
    END IF;

    -- Get user name from raw_user_meta_data or email
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Member') INTO v_user_name
    FROM auth.users WHERE id = p_user_id;

    -- Insert new member
    INSERT INTO public.group_members (group_id, user_id, name, role)
    VALUES (p_group_id, p_user_id, v_user_name, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    RETURN 'joined';
END;
$$;

-- PHASE 3: INVITE VALIDATION FUNCTION
-- Returns the group_id if the token is valid and not expired (10 min expiry as per hardening requirement).
-- Note: group_share_links currently defaults to 24h, but we enforce 10m here for the high-security flow.
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token text)
RETURNS TABLE(group_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT gi.group_id
    FROM public.group_share_links gi
    WHERE gi.token = p_token
    AND gi.created_at + interval '10 minutes' > NOW();
END;
$$;

-- PHASE 4: SAFE JOIN VIA TOKEN
-- Entry point for token-based joins, combining validation and idempotent join.
CREATE OR REPLACE FUNCTION public.join_group_via_token(
    p_user_id uuid,
    p_token text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_group_id uuid;
BEGIN
    -- Validate token
    SELECT group_id INTO v_group_id
    FROM public.validate_invite_token(p_token)
    LIMIT 1;

    IF v_group_id IS NULL THEN
        RETURN 'invalid_or_expired';
    END IF;

    -- Execute safe join
    RETURN public.join_group_safe(p_user_id, v_group_id);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.join_group_safe(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, text) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
