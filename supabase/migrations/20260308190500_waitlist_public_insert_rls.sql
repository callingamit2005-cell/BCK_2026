-- Ensure public landing can insert into waitlist without auth.
-- Keeps UI/business flow unchanged; infra-only policy correction.

alter table public.waitlist_users enable row level security;

-- Remove legacy policies that might block anon writes.
drop policy if exists "Allow anonymous waitlist insert" on public.waitlist_users;
drop policy if exists "Allow public waitlist insert" on public.waitlist_users;
drop policy if exists "Enable insert for anon users" on public.waitlist_users;

create policy "Allow public waitlist insert"
  on public.waitlist_users
  for insert
  to anon
  with check (true);
