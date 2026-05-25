-- HARDENED RPC: Atomic Member Join with Ghost Merge
-- security invoker for production safety
-- deterministic normalization with empty-name guard

ALTER TABLE public.group_members ALTER COLUMN user_id TYPE TEXT;

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
  ghost_id text;
  existing_real uuid;
begin
  -- Normalize name: lower, trim, replace non-alphanumeric with _, trim underscores
  normalized := lower(trim(p_name));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '_', 'g');
  normalized := regexp_replace(normalized, '^_+|_+$', '', 'g');
  
  -- Task 4: Hardened Guard
  if normalized = '' or normalized is null then
    raise exception 'Invalid name: normalized name cannot be empty';
  end if;

  ghost_id := 'ghost_' || p_group_id::text || '_' || normalized;

  -- check if real user already exists
  select id into existing_real
  from group_members
  where group_id = p_group_id
  and user_id = p_user_id::text
  limit 1;

  if existing_real is not null then
    return;
  end if;

  -- merge ghost → real (if exists)
  update group_members
  set user_id = p_user_id::text,
      name = p_name
  where group_id = p_group_id
  and user_id = ghost_id;

  if not found then
    -- normal insert if no ghost to merge
    insert into group_members (group_id, user_id, name, role)
    values (p_group_id, p_user_id::text, p_name, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

end;
$$;