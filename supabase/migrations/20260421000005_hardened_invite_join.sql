-- 🛠️ HARDENED ATOMIC INVITE SYSTEM RPC: join_group_via_token
-- Description: Production-grade atomic join logic using UPDATE ... RETURNING.
-- Fixes: Race conditions, parameter ambiguity, null safety, and accurate membership detection.

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
  -- 1. UNAUTHORIZED USER PROTECTION
  IF join_group_via_token.user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'UNAUTHORIZED'
    );
  END IF;

  -- 2. ATOMIC TOKEN CLAIM (Eliminates race conditions)
  -- This pattern ensures a token is consumed exactly once by the first request to succeed.
  UPDATE public.group_invites
  SET is_used = true
  WHERE token = invite_token
    AND is_used = false
    AND expires_at > now()
  RETURNING * INTO invite_record;

  -- 3. NULL SAFETY FIX
  IF invite_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_OR_EXPIRED'
    );
  END IF;

  -- 4. VALIDATE GROUP ID
  IF invite_record.group_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'INVALID_GROUP'
    );
  END IF;

  -- 5. SECURE MEMBER INSERTION (Explicit Parameter Safety)
  -- Uses ON CONFLICT to maintain idempotency without pre-checking.
  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (
    invite_record.group_id,
    join_group_via_token.user_id,
    invite_record.name,
    'member'
  )
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- 6. ACCURATE already_member DETECTION
  -- Captures whether the INSERT above actually created a new row.
  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  v_is_already_member := (v_rowcount = 0);

  -- 7. RETURN STRUCTURED JSON RESPONSE
  RETURN json_build_object(
    'success', true,
    'already_member', v_is_already_member,
    'message', CASE WHEN v_is_already_member THEN 'User already in group' ELSE 'Joined successfully' END,
    'group_id', invite_record.group_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on failure
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
