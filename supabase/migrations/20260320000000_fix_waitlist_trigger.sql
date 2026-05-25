-- Enable http extension for outbound calls
create extension if not exists "http" with schema "extensions";

-- 1. Ensure status column exists and has proper constraints
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                   where table_name='waitlist_users' and column_name='status') then
        alter table public.waitlist_users add column status text not null default 'pending';
    end if;
end $$;

-- 2. Infrastructure Settings Table (for internal config)
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- 3. Create internal trigger function for Edge Function dispatch
create or replace function public.trigger_welcome_email_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  base_url text;
  api_key text;
begin
  -- Construct payload matching Edge Function expectations (record-based for triggers)
  payload := jsonb_build_object(
    'record', jsonb_build_object('email', NEW.email)
  );

  -- Retrieve infrastructure configuration
  select value into base_url from public.settings where key = 'edge_function_base_url';
  select value into api_key from public.settings where key = 'app_secret_key';

  -- Only proceed if configuration is present
  if base_url is not null and api_key is not null then
    perform
      extensions.http_post(
        url := base_url || '/send-welcome-email',
        body := payload::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-api-key', api_key
        )::text
      );
    
    raise notice 'Dispatching welcome email for %', NEW.email;
  else
    raise warning 'Welcome email trigger skipped: Infrastructure settings missing in public.settings';
  end if;

  return NEW;
exception when others then
  -- CRITICAL: Prevent trigger failure from blocking the primary insert
  raise warning 'Welcome email trigger failed for %: %', NEW.email, SQLERRM;
  return NEW;
end;
$$;

-- 4. Attach trigger to table
drop trigger if exists on_waitlist_insert on public.waitlist_users;
create trigger on_waitlist_insert
  after insert on public.waitlist_users
  for each row
  execute function public.trigger_welcome_email_dispatch();

-- 5. Comment for documentation
comment on function public.trigger_welcome_email_dispatch() is 'Dispatches a call to send-welcome-email Edge Function whenever a new user joins the waitlist.';
