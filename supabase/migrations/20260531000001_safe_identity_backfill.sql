-- 🛡️ [BK-PRODUCTION-REPAIR] Safe Identity Backfill
-- Purpose: Repair NULL canonical_key records while respecting the sync conflict trigger.
-- Strategy: Force updated_at = NOW() to bypass the "Latest Wins" guard.
-- Date: 2026-05-31

-- 1. Perform Surgical Backfill
-- We use NOW() to ensure the trigger accepts the update as "newer".
UPDATE public.transactions
SET 
    canonical_key = 'legacy:' || id,
    updated_at = NOW()
WHERE canonical_key IS NULL;

-- 2. Verify Repair Integrity
-- This query should return 0 if the repair was successful.
SELECT COUNT(*) as remaining_null_keys
FROM public.transactions
WHERE canonical_key IS NULL;

-- 3. Identity Integrity Hardening
-- Ensure the unique constraint is active.
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS unique_user_canonical_key;

ALTER TABLE public.transactions 
ADD CONSTRAINT unique_user_canonical_key UNIQUE (user_id, canonical_key);

-- 4. Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
