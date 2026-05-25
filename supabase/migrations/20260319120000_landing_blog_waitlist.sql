-- Landing and blog support tables for production wiring
create extension if not exists pgcrypto;

create table if not exists public.waitlist_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  status text not null default 'draft',
  category_id uuid references public.blog_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_name text not null unique,
  content_json jsonb,
  updated_at timestamptz not null default now()
);

alter table public.waitlist_users enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.site_content enable row level security;

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

drop policy if exists "Allow public read categories" on public.blog_categories;
create policy "Allow public read categories"
  on public.blog_categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public read published posts" on public.blog_posts;
create policy "Allow public read published posts"
  on public.blog_posts
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Allow public read site content" on public.site_content;
create policy "Allow public read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

create index if not exists idx_waitlist_users_email on public.waitlist_users(email);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_status_created on public.blog_posts(status, created_at desc);
