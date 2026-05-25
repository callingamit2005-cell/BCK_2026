create or replace function merge_or_insert_member(
  p_group_id uuid,
  p_user_id uuid,
  p_name text
)
returns void
language plpgsql
security invoker
as $$
declare
  normalized text;
  v_ghost_id text;
  existing_real uuid;
begin

  -- normalize
  normalized := lower(trim(p_name));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '_', 'g');
  normalized := regexp_replace(normalized, '^_+|_+$', '', 'g');

  if normalized = '' then
    raise exception 'Invalid name';
  end if;

  v_ghost_id := 'ghost_' || p_group_id || '_' || normalized;

  -- check real user
  select id into existing_real
  from group_members
  where group_id = p_group_id
  and user_id = p_user_id
  limit 1;

  if existing_real is not null then
    return;
  end if;

  -- merge ghost → real
  update group_members
  set user_id = p_user_id,
      ghost_id = null,
      name = p_name
  where group_id = p_group_id
  and ghost_id = v_ghost_id;

  if not found then
    insert into group_members (group_id, user_id, name, role)
    values (p_group_id, p_user_id, p_name, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

end;
$$;