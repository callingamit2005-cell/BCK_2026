
-- Phase 4: Member UPI Field
-- Description: Add upi_id to group_members to support UPI payments.

ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS upi_id TEXT;
