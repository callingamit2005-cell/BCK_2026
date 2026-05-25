-- Migration: add sms_hash to transactions for duplicate detection
-- Date: 2026-04-03

alter table public.transactions
add column if not exists sms_hash text unique;

-- Re-create policy to ensure everything is correct (optional but safe)
drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions"
    on public.transactions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
