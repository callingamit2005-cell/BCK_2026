-- 🛠️ Phase 7: Secure Token-Based Invite System Restoration
-- Purpose: Restore and harden the token-based join system, unifying share links and direct invites.
-- Status: Production Safe | Atomic | Hardened.

-- 1. HARDEN group_share_links GENERATION
-- Ensures only group admins can create shareable links.
CREATE OR REPLACE FUNCTION public.generate_share_link(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token text;
BEGIN
    -- 🛡️ STRICT AUTH CHECK: Only Admins can generate share links
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = p_group_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admins can generate invite links.';
    END IF;

    -- Generate a new link or return existing valid one (24h expiry)
    SELECT token INTO v_token FROM public.group_share_links
    WHERE group_id = p_group_id AND created_by = auth.uid() AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

    IF v_token IS NULL THEN
        INSERT INTO public.group_share_links (group_id, created_by, expires_at)
        VALUES (p_group_id, auth.uid(), now() + interval '24 hours')
        RETURNING token INTO v_token;
    END IF;

    RETURN v_token;
END;
$$;

-- 2. UNIFIED ATOMIC JOIN RPC (V3)
-- Purpose: Handles both single-use group_invites (UUID) and multi-use group_share_links (Text).
-- Security: DEFINER solves RLS deadlock for joining users.
DROP FUNCTION IF EXISTS public.join_group_via_token(uuid, uuid);
DROP FUNCTION IF EXISTS public.join_group_via_token(uuid, text);

CREATE OR REPLACE FUNCTION public.join_group_via_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id uuid;
    v_invite_name text;
    v_user_id uuid := auth.uid();
    v_user_name text;
    v_is_already_member boolean;
    v_rowcount int;
    v_token_uuid uuid;
    v_invite_record record;
BEGIN
    -- 1. AUTH GUARD
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'AUTH_REQUIRED');
    END IF;

    -- 2. RESOLVE USER NAME (Derive from metadata or email)
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Member') INTO v_user_name
    FROM auth.users WHERE id = v_user_id;

    -- 3. VALIDATE TOKEN (Unified Strategy)
    -- 3.1 Try group_invites (Single-use UUID)
    BEGIN
        v_token_uuid := p_token::uuid;
        
        UPDATE public.group_invites
        SET is_used = true, status = 'accepted'
        WHERE token = v_token_uuid AND is_used = false AND expires_at > now()
        RETURNING group_id, name INTO v_invite_record;
        
        IF v_invite_record IS NOT NULL THEN
            v_group_id := v_invite_record.group_id;
            v_invite_name := v_invite_record.name;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Not a valid UUID or other error, proceed to share links
    END;

    -- 3.2 Try group_share_links (Multi-use Text)
    IF v_group_id IS NULL THEN
        SELECT group_id INTO v_group_id
        FROM public.group_share_links
        WHERE token = p_token AND expires_at > now()
        LIMIT 1;
    END IF;

    -- 4. FINAL VALIDATION
    IF v_group_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'INVALID_OR_EXPIRED');
    END IF;

    -- 5. ATOMIC JOIN / GHOST MERGE
    -- Check if user is already a member
    SELECT EXISTS(SELECT 1 FROM public.group_members WHERE group_id = v_group_id AND user_id = v_user_id) INTO v_is_already_member;

    IF NOT v_is_already_member THEN
        -- Adopt Ghost Member logic: 
        -- If an invite name was specified or user name matches a ghost, try to adopt it.
        -- But for simplicity and safety in unified flow, we use the merge_or_insert logic.
        
        -- Try to update a ghost that matches this user's name or is marked as ghost for them
        -- (This part of logic is surgical to maintain BachatKaro's Ghost adoption architecture)
        UPDATE public.group_members
        SET user_id = v_user_id, ghost_id = NULL
        WHERE group_id = v_group_id 
        AND (
            ghost_id = 'ghost_' || v_group_id || '_' || lower(regexp_replace(v_user_name, '[^a-zA-Z0-9]', '_', 'g'))
            OR (user_id IS NULL AND lower(name) = lower(v_user_name))
        )
        AND user_id IS NULL;

        GET DIAGNOSTICS v_rowcount = ROW_COUNT;
        
        IF v_rowcount = 0 THEN
            -- No ghost to adopt, insert fresh membership
            INSERT INTO public.group_members (group_id, user_id, name, role)
            VALUES (v_group_id, v_user_id, COALESCE(v_invite_name, v_user_name), 'member')
            ON CONFLICT (group_id, user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'group_id', v_group_id,
        'already_member', v_is_already_member,
        'message', CASE WHEN v_is_already_member THEN 'Already joined' ELSE 'Welcome to the group!' END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.join_group_via_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(text) TO anon;

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';
