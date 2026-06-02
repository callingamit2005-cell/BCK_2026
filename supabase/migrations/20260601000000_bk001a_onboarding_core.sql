-- PHASE BK-001A: New User Setup Infrastructure
-- Description: Adds persistent onboarding flags and an atomic finalization RPC.
-- Safety: Idempotent and backward compatible.

-- 1. Expand profiles table with onboarding flags
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS has_completed_setup BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_completed BOOLEAN DEFAULT false;

-- 2. Backfill existing users (The Shield)
-- Prevents existing users from being forced into the wizard.
UPDATE public.profiles 
SET has_completed_setup = true, privacy_completed = true 
WHERE has_completed_setup IS NULL;

-- 3. Create Atomic Finalization RPC
-- Ensures user metadata and profile flags are updated in a single transaction.
-- Authoritative Source: auth.uid()
CREATE OR REPLACE FUNCTION public.finalize_user_onboarding(p_country text, p_language text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Authorization Guard
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Step A: Sync user_preferences (Authoritative source for Region/Lang)
  -- Uses UPSERT logic
  INSERT INTO public.user_preferences (user_id, country, language, updated_at)
  VALUES (v_user_id, p_country, p_language, now())
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    country = EXCLUDED.country,
    language = EXCLUDED.language,
    updated_at = now();

  -- Step B: Update Profiles (Authoritative source for State Flags)
  UPDATE public.profiles 
  SET 
    has_completed_setup = true, 
    privacy_completed = true,
    updated_at = now()
  WHERE id = v_user_id;

END;
$$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
