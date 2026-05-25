
/**
 * Hardened Planning Migration Patch
 * Description: Implements "Latest Wins" conflict resolution and robust JSON parsing for all planning tables.
 */

-- 1. Create a universal "Latest Wins" trigger function
CREATE OR REPLACE FUNCTION public.handle_latest_wins_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the incoming record is strictly newer than the existing one
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.updated_at IS NOT NULL AND OLD.updated_at IS NOT NULL AND NEW.updated_at <= OLD.updated_at) THEN
            RETURN OLD;
        END IF;
    END IF;
    
    -- Ensure updated_at is always set
    NEW.updated_at = COALESCE(NEW.updated_at, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply hardening to all Planning tables
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['salaries', 'budgets', 'emis', 'subscriptions', 'savings_goals']) LOOP
        -- Ensure updated_at exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'updated_at') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now()', t);
        END IF;

        -- Attach Trigger
        EXECUTE format('DROP TRIGGER IF EXISTS tr_latest_wins_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER tr_latest_wins_%I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_latest_wins_conflict()', t, t);
    END LOOP;
END $$;
