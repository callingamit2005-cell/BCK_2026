-- PHASE 1: Active Group Hybrid Model (Cloud Secondary)
-- Scope: Adds active_group_id persistence to user_preferences without touching routing logic.
-- Safety: Idempotent + forward compatible (creates table only if missing).

DO $$
BEGIN
  -- 0) Ensure user_preferences exists (repo migrations may not include its creation, but production schema does).
  IF to_regclass('public.user_preferences') IS NULL THEN
    CREATE TABLE public.user_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid UNIQUE,
      language text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      country text,
      is_new_user boolean DEFAULT false
    );
  END IF;

  -- 1) Add columns for cloud secondary active-group state
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_preferences' AND column_name='active_group_id'
  ) THEN
    ALTER TABLE public.user_preferences ADD COLUMN active_group_id uuid NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_preferences' AND column_name='active_group_updated_at'
  ) THEN
    ALTER TABLE public.user_preferences ADD COLUMN active_group_updated_at timestamptz NULL;
  END IF;

  -- 2) RLS policies (only if missing). Keep minimal, user-scoped.
  BEGIN
    ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN others THEN
    -- ignore
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_select_own') THEN
    CREATE POLICY user_preferences_select_own
      ON public.user_preferences
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_upsert_own') THEN
    CREATE POLICY user_preferences_upsert_own
      ON public.user_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_update_own') THEN
    CREATE POLICY user_preferences_update_own
      ON public.user_preferences
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

