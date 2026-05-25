-- 🛡️ Phase 30: Production Schema Parity Fix
-- Purpose: Add missing is_deleted column to transactions table to resolve query failures.
-- 1. Add column with safe default
-- 2. Backfill existing records
-- 3. Add performance index
-- 4. Force schema cache reload

-- 1. ADD COLUMN
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. BACKFILL (Redundant but safe for specific PG versions)
UPDATE public.transactions 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

-- 3. ADD INDEX
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted 
ON public.transactions(is_deleted);

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
