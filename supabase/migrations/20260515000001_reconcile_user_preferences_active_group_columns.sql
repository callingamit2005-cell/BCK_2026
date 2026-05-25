-- =========================================================
-- RECONCILIATION MIGRATION (MINIMAL / SURGICAL)
-- Purpose:
--   Fix production schema drift where public.user_preferences is missing:
--     - active_group_id (uuid)
--     - active_group_updated_at (timestamptz)
--
-- Constraints:
--   - NO business logic changes
--   - NO routing changes
--   - NO UI/frontend changes
--   - NO RLS rewrites (only schema columns)
--   - Idempotent and safe on older production DB states
--   - Includes deterministic PostgREST schema cache reload
-- =========================================================

DO $$
BEGIN
  -- Guard: if table is absent in some environment, do not create/alter anything here.
  -- (Table creation is intentionally handled elsewhere to keep this migration minimal.)
  IF to_regclass('public.user_preferences') IS NULL THEN
    RAISE NOTICE 'public.user_preferences does not exist; skipping active group reconciliation.';
    RETURN;
  END IF;

  -- Add missing columns only (no other schema modifications).
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_preferences'
      AND column_name  = 'active_group_id'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD COLUMN active_group_id uuid NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_preferences'
      AND column_name  = 'active_group_updated_at'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD COLUMN active_group_updated_at timestamptz NULL;
  END IF;
END $$;

-- Deterministic PostgREST schema cache reload (required for immediate visibility).
NOTIFY pgrst, 'reload schema';

