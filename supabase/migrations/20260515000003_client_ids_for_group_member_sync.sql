-- Allow Android offline queueing to use the same IDs locally and in Supabase.
-- Existing web calls remain compatible because the new ID arguments are optional.

DROP FUNCTION IF EXISTS public.create_group_with_admin(text);

CREATE OR REPLACE FUNCTION public.create_group_with_admin(
  p_name text,
  p_group_id uuid DEFAULT NULL,
  p_member_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid := COALESCE(p_group_id, gen_random_uuid());
  v_member_id uuid;
  v_inserted_member_id uuid;
  v_user_id uuid;
  v_display_name text;
  v_clean_name text;
  v_existing_owner uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  v_clean_name := trim(coalesce(p_name, ''));
  IF v_clean_name = '' THEN
    RETURN json_build_object('success', false, 'reason', 'NAME_REQUIRED');
  END IF;

  SELECT user_id INTO v_existing_owner
  FROM public.groups
  WHERE id = v_group_id;

  IF v_existing_owner IS NOT NULL THEN
    IF v_existing_owner <> v_user_id THEN
      RETURN json_build_object('success', false, 'reason', 'GROUP_ID_CONFLICT');
    END IF;
  ELSE
    INSERT INTO public.groups (id, name, user_id)
    VALUES (v_group_id, v_clean_name, v_user_id);
  END IF;

  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'full_name'),
    (auth.jwt() ->> 'email'),
    'You'
  ) INTO v_display_name;

  SELECT id INTO v_member_id
  FROM public.group_members
  WHERE group_id = v_group_id
    AND user_id = v_user_id
  LIMIT 1;

  IF v_member_id IS NULL THEN
    v_member_id := COALESCE(p_member_id, gen_random_uuid());

    INSERT INTO public.group_members (id, group_id, user_id, name, role)
    VALUES (v_member_id, v_group_id, v_user_id, v_display_name, 'admin')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_inserted_member_id;

    IF v_inserted_member_id IS NULL THEN
      SELECT id INTO v_member_id
      FROM public.group_members
      WHERE group_id = v_group_id
        AND user_id = v_user_id
      LIMIT 1;

      IF v_member_id IS NULL THEN
        RETURN json_build_object('success', false, 'reason', 'MEMBER_ID_CONFLICT');
      END IF;
    ELSE
      v_member_id := v_inserted_member_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'group_id', v_group_id,
    'member_id', v_member_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_with_admin(text, uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.add_group_member_ghost(uuid, text);

CREATE OR REPLACE FUNCTION public.add_group_member_ghost(
  p_group_id uuid,
  p_name text,
  p_member_id uuid DEFAULT NULL
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
      (p_member_id IS NOT NULL AND id = p_member_id)
      OR ghost_id = v_ghost_id
      OR lower(trim(name)) = lower(v_clean_name)
    )
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', true);
  END IF;

  IF p_member_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE id = p_member_id
      AND group_id <> p_group_id
  ) THEN
    RETURN json_build_object('success', false, 'reason', 'MEMBER_ID_CONFLICT');
  END IF;

  v_member_id := COALESCE(p_member_id, gen_random_uuid());

  INSERT INTO public.group_members (id, group_id, user_id, ghost_id, name, role)
  VALUES (v_member_id, p_group_id, NULL, v_ghost_id, v_clean_name, 'member')
  RETURNING id INTO v_member_id;

  RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO v_member_id
    FROM public.group_members
    WHERE group_id = p_group_id
      AND (
        (p_member_id IS NOT NULL AND id = p_member_id)
        OR ghost_id = v_ghost_id
        OR lower(trim(name)) = lower(v_clean_name)
      )
    LIMIT 1;

    RETURN json_build_object('success', true, 'member_id', v_member_id, 'duplicate', true);
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_group_member_ghost(uuid, text, uuid) TO authenticated;
