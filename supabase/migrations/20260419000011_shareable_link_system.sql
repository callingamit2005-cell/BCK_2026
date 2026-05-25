
-- MIGRATION: Secure Shareable Link System
-- Description: Adds a secure, expiring token system for sharing groups via WhatsApp.

-- 1. Create the table for tracking shareable links
CREATE TABLE IF NOT EXISTS public.group_share_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by token
CREATE INDEX IF NOT EXISTS idx_group_share_links_token ON public.group_share_links(token);

-- RLS Policies
ALTER TABLE public.group_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid share links"
ON public.group_share_links FOR SELECT
USING (expires_at > now());

CREATE POLICY "Group members can create share links"
ON public.group_share_links FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_share_links.group_id AND user_id = auth.uid()));

-- 2. Create RPC to generate the link
CREATE OR REPLACE FUNCTION public.generate_share_link(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token text;
BEGIN
    -- Check membership
    IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Generate a new link or return existing valid one
    SELECT token INTO v_token FROM public.group_share_links
    WHERE group_id = p_group_id AND created_by = auth.uid() AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

    IF v_token IS NULL THEN
        INSERT INTO public.group_share_links (group_id, created_by)
        VALUES (p_group_id, auth.uid())
        RETURNING token INTO v_token;
    END IF;

    RETURN v_token;
END;
$$;

-- 3. Create RPC to join via token
CREATE OR REPLACE FUNCTION public.join_group_via_share_link(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_group_id uuid;
    v_user_name text;
BEGIN
    -- Validate token
    SELECT group_id INTO v_group_id FROM public.group_share_links
    WHERE token = p_token AND expires_at > now();

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite link';
    END IF;

    -- Check if already member
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_group_id AND user_id = auth.uid()) THEN
        RETURN v_group_id; -- Already a member, treat as success
    END IF;

    -- Get user name from raw_user_meta_data or email
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Member') INTO v_user_name
    FROM auth.users WHERE id = auth.uid();

    -- Insert new member
    INSERT INTO public.group_members (group_id, user_id, name, role)
    VALUES (v_group_id, auth.uid(), v_user_name, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    RETURN v_group_id;
END;
$$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
