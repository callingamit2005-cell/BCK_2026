-- 🛠️ Phase 21: Canonical Join RPC Compatibility Layer
-- Purpose: Create a canonical join_group_via_token(p_token text) wrapper for frontend compatibility.
-- Objective: Resolve PostgREST overload resolution failure while preserving existing UUID systems.
-- Security: DEFINER ensures RLS-safe joining for authenticated users.

-- 1. Ensure pgcrypto for token resolution
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ROBUST INTERNAL LOGIC PROVIDER (V3)
-- This version handles the actual atomic join and ghost adoption logic.
-- Returns JSONB for rich frontend feedback.
CREATE OR REPLACE FUNCTION public.join_group_via_token(
    p_user_id uuid,
    p_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_group_id uuid;
    v_invite_name text;
    v_user_name text;
    v_is_already_member boolean;
    v_rowcount int;
    v_token_uuid uuid;
    v_invite_record record;
BEGIN
    -- 1. AUTH GUARD
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'AUTH_REQUIRED');
    END IF;

    -- 2. RESOLVE USER NAME
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Member') INTO v_user_name
    FROM auth.users WHERE id = p_user_id;

    -- 3. VALIDATE TOKEN
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

    -- 5. ATOMIC JOIN / GHOST ADOPTION
    SELECT EXISTS(SELECT 1 FROM public.group_members WHERE group_id = v_group_id AND user_id = p_user_id) INTO v_is_already_member;

    IF NOT v_is_already_member THEN
        -- Atomic Ghost Adoption (Surgical)
        UPDATE public.group_members
        SET user_id = p_user_id, ghost_id = NULL
        WHERE group_id = v_group_id 
        AND (
            ghost_id = 'ghost_' || v_group_id || '_' || lower(regexp_replace(v_user_name, '[^a-zA-Z0-9]', '_', 'g'))
            OR (user_id IS NULL AND lower(name) = lower(v_user_name))
        )
        AND user_id IS NULL;

        GET DIAGNOSTICS v_rowcount = ROW_COUNT;
        
        IF v_rowcount = 0 THEN
            INSERT INTO public.group_members (group_id, user_id, name, role)
            VALUES (v_group_id, p_user_id, COALESCE(v_invite_name, v_user_name), 'member')
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

-- 3. CANONICAL FRONTEND WRAPPER (ZERO-BLAST-RADIUS)
-- This matches exactly what the frontend calls: supabase.rpc("join_group_via_token", { p_token: token })
CREATE OR REPLACE FUNCTION public.join_group_via_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Forward to internal provider using current session user
    RETURN public.join_group_via_token(auth.uid(), p_token);
END;
$$;

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.join_group_via_token(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, text) TO authenticated, anon;

-- 5. Force Schema Refresh
NOTIFY pgrst, 'reload schema';
