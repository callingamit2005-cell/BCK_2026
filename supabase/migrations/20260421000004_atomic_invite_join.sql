-- Migration: atomic_invite_join
-- Purpose: Fix race condition in invite join system using atomic UPDATE ... RETURNING.

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
  -- 1. ATOMIC UPDATE (Prevents race conditions)
  UPDATE public.group_invites
  SET is_used = true
  WHERE token = invite_token
  AND is_used = false
  AND expires_at > now()
  RETURNING * INTO invite_record;

  -- 2. Handle invalid or already used token
  IF invite_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_OR_EXPIRED'
    );
  END IF;

  -- 3. Check if user is already a member (Idempotency)
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = invite_record.group_id AND user_id = user_id
  ) THEN
    RETURN json_build_object(
      'success', true,
      'already_member', true,
      'group_id', invite_record.group_id
    );
  END IF;

  -- 4. Insert new membership
  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (
    invite_record.group_id,
    user_id,
    invite_record.name,
    'member'
  );

  RETURN json_build_object(
    'success', true,
    'group_id', invite_record.group_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automatically happens on exception in PL/pgSQL
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
