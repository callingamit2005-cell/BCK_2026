-- 20260510000000_upi_identity_architecture.sql
-- 🛠️ Phase 3: UPI Identity Architecture
-- Objective: Support validated UPI identities for secure settlements.

-- 1. Expand profiles table with enterprise payment fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_upi_app TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_verification_state TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Expand group_members table (for member-specific UPI, supporting ghost members)
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- 🛡️ [SECURITY] Verification State check constraint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_upi_verification_state'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_upi_verification_state 
        CHECK (upi_verification_state IN ('unverified', 'pending', 'verified', 'rejected'));
    END IF;
END $$;

-- 3. Automatic sync trigger (Optional but good for UX)
-- When a user updates their profile UPI, we can sync it to their group_members entries
-- But for now, we'll handle it via application logic to maintain control.
