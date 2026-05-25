-- Migration: harden_invite_system_v2
-- Purpose: Complete overhaul of the invite system to support secure, single-use, expiring tokens.

-- 1. Hardening group_invites table
DO $$
BEGIN
    -- Add token column if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'group_invites' AND column_name = 'token') THEN
        ALTER TABLE public.group_invites ADD COLUMN token uuid DEFAULT gen_random_uuid() UNIQUE;
    END IF;

    -- Add expires_at column if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'group_invites' AND column_name = 'expires_at') THEN
        ALTER TABLE public.group_invites ADD COLUMN expires_at timestamptz DEFAULT now() + interval '24 hours' NOT NULL;
    END IF;

    -- Add is_used column if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'group_invites' AND column_name = 'is_used') THEN
        ALTER TABLE public.group_invites ADD COLUMN is_used boolean DEFAULT false NOT NULL;
    END IF;

    -- Add name column if missing (for the member display name)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'group_invites' AND column_name = 'name') THEN
        ALTER TABLE public.group_invites ADD COLUMN name text DEFAULT 'Member' NOT NULL;
    END IF;
END $$;

-- 2. CREATE FUNCTION join_group_via_token (CRITICAL FIX)
-- Using the requested logic for single-use expiring tokens.
CREATE OR REPLACE FUNCTION public.join_group_via_token(
  invite_token UUID,
  user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN

  -- Validate token existence, expiry, and usage status
  SELECT * INTO invite_record
  FROM public.group_invites
  WHERE token = invite_token
  AND expires_at > now()
  AND is_used = false;

  IF invite_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_OR_EXPIRED'
    );
  END IF;

  -- Insert membership (Idempotent)
  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (
    invite_record.group_id,
    user_id,
    invite_record.name,
    'member'
  )
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Mark token as used to prevent multi-tab/multi-user reuse
  UPDATE public.group_invites
  SET is_used = true
  WHERE token = invite_token;

  RETURN json_build_object(
    'success', true,
    'group_id', invite_record.group_id
  );

END;
$$;

-- 3. REMOVE BROKEN FALLBACK (accept_invite is now redundant)
DROP FUNCTION IF EXISTS public.accept_invite(text);

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO anon;

-- Refresh API Cache
NOTIFY pgrst, 'reload schema';
