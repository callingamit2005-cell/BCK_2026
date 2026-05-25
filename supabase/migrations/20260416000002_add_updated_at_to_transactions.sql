
-- Migration: add_updated_at_to_transactions
-- Description: Adds updated_at column to transactions for conflict resolution.

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create a trigger to update the updated_at column with LATEST WINS logic
CREATE OR REPLACE FUNCTION public.handle_transaction_sync_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. On UPDATE (Sync Conflict), only proceed if incoming data is strictly newer
    IF (TG_OP = 'UPDATE') THEN
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

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_transaction_sync_conflict();
