-- 🛠️ SUPABASE RPC FIX: join_group_via_token
-- Objective: Resolve RPC 404 error and ensure atomic join logic.

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
  v_is_already_member BOOLEAN;
  v_rowcount INT;
BEGIN

  -- 1. SECURITY: Prevent user identity spoofing by using session auth.uid()
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'UNAUTHORIZED'
    );
  END IF;

  -- 2. ATOMIC CLAIM: Consume token if unused and not expired
  UPDATE public.group_invites
  SET is_used = true
  WHERE token = invite_token
    AND is_used = false
    AND expires_at > now()
  RETURNING * INTO invite_record;

  -- 3. VALIDATION: Check if a valid invitation was claimed
  IF invite_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_OR_EXPIRED'
    );
  END IF;

  IF invite_record.group_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_GROUP'
    );
  END IF;

  -- 4. JOIN EXECUTION: Idempotent member insertion
  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (
    invite_record.group_id,
    auth.uid(),
    invite_record.name,
    'member'
  )
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- 5. STATUS DETECTION: Determine if user was already in the group
  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  v_is_already_member := (v_rowcount = 0);

  RETURN json_build_object(
    'success', true,
    'already_member', v_is_already_member,
    'group_id', invite_record.group_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 🛡️ PERMISSIONS
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_via_token(uuid, uuid) TO anon;

-- 🔄 CACHE REFRESH
NOTIFY pgrst, 'reload schema';
