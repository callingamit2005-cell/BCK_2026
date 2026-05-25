-- 🛠️ Phase 18: Surgical Invite RPC Hardening Implementation
-- Purpose: Fix NOT NULL violation in group_share_links by explicitly generating the token inside the RPC.
-- Verifies: pgcrypto availability and atomic token generation.

-- 1. Ensure pgcrypto is available (Safe for production)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Redefine generate_share_link with explicit token generation
-- This version replaces the one in 20260520000001_unified_invite_join_system.sql
CREATE OR REPLACE FUNCTION public.generate_share_link(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
        -- 🚀 SURGICAL FIX: Explicitly generate cryptographically random token inside the transaction.
        -- This bypasses the potentially missing table-level DEFAULT and fixes the NOT NULL violation.
        v_token := encode(gen_random_bytes(16), 'hex');
        
        INSERT INTO public.group_share_links (group_id, created_by, token, expires_at)
        VALUES (p_group_id, auth.uid(), v_token, now() + interval '24 hours');
    END IF;

    RETURN v_token;
END;
$$;

-- 3. Force Schema Refresh
NOTIFY pgrst, 'reload schema';
