-- Migration: add_unique_constraint_group_members
-- Purpose: Fix "no unique or exclusion constraint matching the ON CONFLICT specification" error.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_group_member'
    ) THEN
        ALTER TABLE group_members
        ADD CONSTRAINT unique_group_member UNIQUE (group_id, name);
    END IF;
END $$;
