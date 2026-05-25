-- Phase 1: Admin-created ghost members for manual split participants.
-- Keeps user_id reserved for real authenticated users and uses ghost_id for named ledger members.

CREATE OR REPLACE FUNCTION public.add_group_member_ghost(
  p_group_id uuid,
  p_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_clean_name text;
  v_normalized text;
  v_ghost_id text;
  v_member_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'UNAUTHORIZED');
  END IF;

  IF p_group_id IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'GROUP_REQUIRED');
  END IF;

  v_clean_name := trim(coalesce(p_name, ''));
  IF v_clean_name = '' THEN
    RETURN json_build_object('success', false, 'reason', 'NAME_REQUIRED');
  END IF;

  IF NOT public.is_admin_of(p_group_id) THEN
    RETURN json_build_object('success', false, 'reason', 'ADMIN_REQUIRED');
  END IF;

  v_normalized := lower(v_clean_name);
  v_normalized := regexp_replace(v_normalized, '[^a-z0-9]+', '_', 'g');
  v_normalized := regexp_replace(v_normalized, '^_+|_+$', '', 'g');

  IF v_normalized = '' THEN
    RETURN json_build_object('success', false, 'reason', 'INVALID_NAME');
  END IF;

  v_ghost_id := 'ghost_' || p_group_id::text || '_' || v_normalized;

  SELECT id INTO v_member_id
  FROM public.group_members
  WHERE group_id = p_group_id
    AND (
      ghost_id = v_ghost_id
      OR lower(trim(name)) = lower(v_clean_name)
    )
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', true);
  END IF;

  INSERT INTO public.group_members (group_id, user_id, ghost_id, name, role)
  VALUES (p_group_id, NULL, v_ghost_id, v_clean_name, 'member')
  RETURNING id INTO v_member_id;

  RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO v_member_id
    FROM public.group_members
    WHERE group_id = p_group_id
      AND (
        ghost_id = v_ghost_id
        OR lower(trim(name)) = lower(v_clean_name)
      )
    LIMIT 1;

    RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', true);
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_group_member_ghost(uuid, text) TO authenticated;
