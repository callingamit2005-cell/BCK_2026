-- Migration: Add canonical_key to transactions for deterministic deduplication
-- Date: 2026-05-23

-- 1. Add column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS canonical_key TEXT;

-- 2. Backfill canonical_key for existing rows
-- 🛡️ [SQL_DETERMINISTIC_IDENTITY]
-- Normalizes merchant name by removing spaces and special chars to ensure multi-source collisions.
UPDATE public.transactions
SET canonical_key = 'canon:' || amount || ':' || extract(epoch from date)::bigint || ':' || lower(regexp_replace(description, '[^a-zA-Z0-9]', '', 'g')) || ':' || type
WHERE canonical_key IS NULL;

-- 3. Repair Rupee-scale amounts for Manual/Voice entries
-- 🛡️ FORENSIC RULE: If source is manual/voice and amount < 10000 (₹100), 
-- it was likely stored in Rupees instead of Paisa during the corruption window.
UPDATE public.transactions 
SET amount = amount * 100,
    canonical_key = 'canon:' || (amount * 100) || ':' || extract(epoch from date)::bigint || ':' || lower(regexp_replace(description, '[^a-zA-Z0-9]', '', 'g')) || ':' || type
WHERE (entry_source IN ('manual', 'voice', 'income') OR sms_hash ~ '^(man:|voice:|inc:)')
AND amount > 0 
AND amount < 10000;

-- 4. Purge Historical Duplicates
-- 🛡️ RULE: Keep newest synced survivor.
DELETE FROM public.transactions a USING (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY user_id, canonical_key 
        ORDER BY updated_at DESC
      ) as rn
      FROM public.transactions
    ) b
    WHERE a.id = b.id AND b.rn > 1;

-- 5. Add unique constraint (per user)
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS unique_user_canonical_key;

ALTER TABLE public.transactions 
ADD CONSTRAINT unique_user_canonical_key UNIQUE (user_id, canonical_key);
