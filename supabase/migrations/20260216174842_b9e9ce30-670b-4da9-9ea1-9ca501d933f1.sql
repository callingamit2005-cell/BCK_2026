-- Drop the problematic unique constraint and replace with name-based uniqueness
ALTER TABLE public.group_members DROP CONSTRAINT unique_member;

-- Add new constraint: prevent duplicate member NAMES per group per user
ALTER TABLE public.group_members ADD CONSTRAINT unique_member_name_per_group UNIQUE (group_id, user_id, name);