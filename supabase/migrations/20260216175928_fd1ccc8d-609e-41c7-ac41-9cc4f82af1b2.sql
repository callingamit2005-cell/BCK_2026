-- Add role column to group_members (backward compatible, defaults to 'member')
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- Update existing group creators to 'admin' role
-- The first member added to each group (by the group owner) gets admin
UPDATE public.group_members gm
SET role = 'admin'
FROM public.groups g
WHERE gm.group_id = g.id
  AND gm.user_id = g.user_id
  AND gm.created_at = (
    SELECT MIN(gm2.created_at)
    FROM public.group_members gm2
    WHERE gm2.group_id = gm.group_id
      AND gm2.user_id = gm.user_id
  );