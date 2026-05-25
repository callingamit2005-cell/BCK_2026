-- 🛠️ Phase 36: Fintech Tombstone Protection
-- Purpose: Safely ensure that once a transaction is deleted, it cannot be resurrected
-- by a fresh SMS rescan after an app reinstall.

CREATE OR REPLACE FUNCTION public.handle_transaction_sync_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. On UPDATE (Sync Conflict)
    IF (TG_OP = 'UPDATE') THEN
        -- 🛡️ [TOMBSTONE PROTECTION]
        -- If the cloud record is already deleted, NEVER allow it to be resurrected.
        -- This prevents a fresh SMS rescan (after app reinstall) from bringing back deleted items.
        IF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
            -- Force the tombstone to persist
            NEW.is_deleted = true;
            NEW.updated_at = now();
            RETURN NEW;
        END IF;

        -- 🛡️ [LATEST WINS]
        -- Only proceed if incoming data is strictly newer
        IF (COALESCE(NEW.updated_at, '1970-01-01'::timestamptz) <= COALESCE(OLD.updated_at, '1970-01-01'::timestamptz)) THEN
            -- Cloud record is newer or same -> Skip the update
            RETURN OLD;
        END IF;
    END IF;

    -- 2. Ensure updated_at is always set
    IF (NEW.updated_at IS NULL) THEN
        NEW.updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';