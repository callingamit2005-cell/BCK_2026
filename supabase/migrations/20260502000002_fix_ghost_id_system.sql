-- PRODUCTION GRADE: Ghost Member System v2
-- 1. Support UUID user_id + TEXT ghost_id
-- 2. Add ghost_id column
-- 3. Restore user_id as UUID and make nullable

-- Fix group_members schema
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS ghost_id TEXT;
ALTER TABLE public.group_members ALTER COLUMN user_id DROP NOT NULL;

-- Convert user_id back to UUID if it was text (safety)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'user_id') = 'text' THEN
        ALTER TABLE public.group_members ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    END IF;
END $$;

-- Add unique constraint for ghost users to prevent duplicates
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS unique_group_ghost;
ALTER TABLE public.group_members ADD CONSTRAINT unique_group_ghost UNIQUE (group_id, ghost_id);

-- Updated RPC function
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
  normalized_name text;
  v_ghost_id text;
  existing_real uuid;
begin
  -- 1. HARDENED NORMALIZATION
  normalized_name := lower(trim(p_name));
  normalized_name := regexp_replace(normalized_name, '[^a-z0-9]+', '_', 'g');
  normalized_name := regexp_replace(normalized_name, '^_+|_+$', '', 'g');
  
  -- 2. EMPTY NAME GUARD
  if normalized_name = '' or normalized_name is null then
    raise exception 'Invalid name: normalized name cannot be empty';
  end if;

  v_ghost_id := 'ghost_' || p_group_id::text || '_' || normalized_name;

  -- 3. CHECK FOR EXISTING REAL USER
  select id into existing_real
  from group_members
  where group_id = p_group_id
  and user_id = p_user_id
  limit 1;

  if existing_real is not null then
    return;
  end if;

  -- 4. ATOMIC MERGE (ghost → real)
  UPDATE group_members
  SET user_id = p_user_id,
      ghost_id = NULL,
      name = p_name
  WHERE group_id = p_group_id
  AND ghost_id = v_ghost_id;

  -- 5. FALLBACK INSERT
  if not found then
    insert into group_members (group_id, user_id, ghost_id, name, role)
    values (p_group_id, p_user_id, NULL, p_name, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

end;
$$;