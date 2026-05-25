
/**
 * Phase: Planning Time Consistency & Audit History
 * Description: Implements is_latest flag, versioning, and auto-archiving of old records to ensure full audit history without data loss.
 */

-- 1. Create Universal Audit Function
CREATE OR REPLACE FUNCTION public.handle_audit_versioning()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new record is marked as latest, deprecate all older records for the same logical group
    IF NEW.is_latest = true THEN
        IF TG_TABLE_NAME = 'salaries' OR TG_TABLE_NAME = 'budgets' THEN
            EXECUTE format(
                'UPDATE public.%I SET is_latest = false WHERE user_id = $1 AND month_year = $2 AND (id != $3 OR idempotency_key != $4)', 
                TG_TABLE_NAME
            ) USING NEW.user_id, NEW.month_year, NEW.id, NEW.idempotency_key;
        END IF;
    END IF;

    -- Ensure updated_at is always server-authoritative
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply to Planning Tables
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['salaries', 'budgets', 'emis', 'subscriptions', 'savings_goals']) LOOP
        -- Add is_latest and version columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'is_latest') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN is_latest BOOLEAN DEFAULT true', t);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'version') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN version BIGINT DEFAULT extract(epoch from now()) * 1000', t);
        END IF;

        -- Attach Trigger for salaries and budgets specifically
        IF t = 'salaries' OR t = 'budgets' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_versioning_%I ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER tr_audit_versioning_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_audit_versioning()', t, t);
        END IF;
    END LOOP;
END $$;
