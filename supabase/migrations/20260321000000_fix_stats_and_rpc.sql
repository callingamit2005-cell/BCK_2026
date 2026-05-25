
-- 1. Create stats table if not exists
create table if not exists public.stats (
    id integer primary key default 1,
    waitlist_count integer not null default 1000,
    updated_at timestamptz not null default now()
);

-- 2. Ensure initial stats row exists
insert into public.stats (id, waitlist_count)
values (1, 1000)
on conflict (id) do nothing;

-- 3. Create increment_waitlist_count function
create or replace function public.increment_waitlist_count()
returns integer
language plpgsql
security definer
as $$
declare
    new_count integer;
begin
    update public.stats
    set waitlist_count = waitlist_count + 1,
        updated_at = now()
    where id = 1
    returning waitlist_count into new_count;
    
    return new_count;
end;
$$;

-- 4. Create waitlist_users table if not exists
create table if not exists public.waitlist_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- 5. Create transactions table if not exists
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    amount decimal not null,
    type text check (type in ('expense', 'income')),
    category text default 'Others',
    description text,
    date timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- 6. Set RLS for stats
alter table public.stats enable row level security;
drop policy if exists "Allow public read stats" on public.stats;
create policy "Allow public read stats"
    on public.stats
    for select
    to anon, authenticated
    using (true);

-- 7. Set RLS for waitlist_users
alter table public.waitlist_users enable row level security;
drop policy if exists "Allow anonymous waitlist insert" on public.waitlist_users;
create policy "Allow anonymous waitlist insert"
    on public.waitlist_users
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists "Allow anonymous waitlist email lookup" on public.waitlist_users;
create policy "Allow anonymous waitlist email lookup"
    on public.waitlist_users
    for select
    to anon, authenticated
    using (true);

-- 8. Set RLS for transactions
alter table public.transactions enable row level security;
drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions"
    on public.transactions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 9. Grant permissions
grant execute on function public.increment_waitlist_count() to anon, authenticated;
grant select on public.stats to anon, authenticated;
grant insert, select on public.waitlist_users to anon, authenticated;
grant all on public.transactions to authenticated;
