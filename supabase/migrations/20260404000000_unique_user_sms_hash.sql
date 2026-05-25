-- Migration: ensure composite unique constraint on (user_id, sms_hash)
-- Date: 2026-04-04

-- Drop global unique constraint on sms_hash if it exists to allow different users to have the same SMS hash (edge case)
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT constraint_name INTO con_name
    FROM information_schema.table_constraints
    WHERE table_name = 'transactions' AND constraint_type = 'UNIQUE' AND constraint_name LIKE '%sms_hash%';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

-- Add a safe composite unique constraint
ALTER TABLE public.transactions ADD CONSTRAINT unique_user_sms_hash UNIQUE (user_id, sms_hash);
