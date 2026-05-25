-- Add is_deleted tombstone column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Notify pgrst to reload schema cache
NOTIFY pgrst, 'reload schema';
