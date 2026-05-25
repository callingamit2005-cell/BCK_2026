-- Migration: atomic_group_creation
-- Description: Creates a group and its admin member in a single transaction.

CREATE OR REPLACE FUNCTION public.create_group_with_admin(p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
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
  VALUES (p_name, v_user_id)
  RETURNING id INTO v_group_id;

  -- 👇 अगर यहाँ fail होगा तो error सीधे दिखेगा
  INSERT INTO public.group_members (group_id, user_id, name, role)
  VALUES (v_group_id, v_user_id, v_display_name, 'admin');

  RETURN json_build_object('success', true, 'group_id', v_group_id);
END;
$$;
