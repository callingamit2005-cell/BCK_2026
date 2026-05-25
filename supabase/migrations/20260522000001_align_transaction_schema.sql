-- 🛡️ Phase 29: Transaction Schema Alignment & Sync Hardening
-- Purpose: Align Supabase transactions table with SQLite schema to preserve critical metadata.
-- 1. Add missing columns: entry_source, payment_mode.
-- 2. Ensure updated_at exists and is trigger-managed.
-- 3. Recover entry_source for legacy records.

-- 1. ADD COLUMNS
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS entry_source text DEFAULT 'sms';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_mode text;

-- 2. RECOVER ENTRY SOURCE FOR LEGACY ROWS (Client-side already does this, but DB layer should be safe)
UPDATE public.transactions 
SET entry_source = 'manual' 
WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'man:%';

UPDATE public.transactions 
SET entry_source = 'voice' 
WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'voice:%';

-- 3. ENSURE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_update_set_updated_at ON public.transactions;
CREATE TRIGGER on_transaction_update_set_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_transactions_updated_at();

-- 4. PERMISSIONS
GRANT ALL ON public.transactions TO authenticated;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
