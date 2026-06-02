-- 🛡️ [BK-STABILIZATION-V1] Transaction Identity Schema Alignment
-- Purpose: Fix PGRST204 error by ensuring canonical_key and idempotency_key parity.
-- Date: 2026-05-31

-- 1. Ensure canonical_key exists (Repair for missing 2026-05-23 deployment)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS canonical_key TEXT;

-- 2. Ensure idempotency_key exists (Schema drift hardening)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 3. Backfill canonical_key for existing rows (Deterministic logic)
-- 🛡️ [SQL_DETERMINISTIC_IDENTITY]
UPDATE public.transactions
SET canonical_key = 'canon:' || amount || ':' || extract(epoch from date)::bigint || ':' || lower(regexp_replace(COALESCE(description, ''), '[^a-zA-Z0-9]', '', 'g')) || ':' || type
WHERE canonical_key IS NULL;

-- 4. Identity Integrity: Canonical Key Constraint
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS unique_user_canonical_key;

ALTER TABLE public.transactions 
ADD CONSTRAINT unique_user_canonical_key UNIQUE (user_id, canonical_key);

-- 5. Identity Integrity: Idempotency Key Constraint
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_idempotency_key_key;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_idempotency_key_key UNIQUE (idempotency_key);

-- 6. Refresh PostgREST cache to resolve PGRST204 immediately
NOTIFY pgrst, 'reload schema';
