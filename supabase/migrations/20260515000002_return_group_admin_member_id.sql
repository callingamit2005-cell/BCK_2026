-- Return the admin membership id from atomic group creation.
-- The client uses this id to seed the offline cache without inventing a local-only member id.

CREATE OR REPLACE FUNCTION public.create_group_with_admin(p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_member_id uuid;
  v_user_id uuid;
  v_display_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'full_name'),
    (auth.jwt() ->> 'email'),
    'You'
  ) INTO v_display_name;

  INSERT INTO public.groups (name, user_id)
  VALUES (trim(p_name), v_user_id)
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (v_group_id, v_user_id, v_display_name, 'admin')
  RETURNING id INTO v_member_id;

  RETURN json_build_object(
    'success', true,
    'group_id', v_group_id,
    'member_id', v_member_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_with_admin(text) TO authenticated;
