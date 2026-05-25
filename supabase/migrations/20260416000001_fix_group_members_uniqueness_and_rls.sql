
-- Migration: fix_group_members_uniqueness_and_rls
-- Description: Ensures group members are unique by (group_id, name) and allows collaborative access.

-- 1. Cleanup duplicates in group_members (keep only one per name per group)
-- This is necessary to avoid failure when adding the UNIQUE constraint.
DELETE FROM public.group_members a USING (
      SELECT MIN(ctid) as ctid, group_id, name
      FROM public.group_members 
      GROUP BY group_id, name 
      HAVING COUNT(*) > 1
) b
WHERE a.group_id = b.group_id 
AND a.name = b.name 
AND a.ctid <> b.ctid;

-- 2. Update unique constraint
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS unique_member_name_per_group;
ALTER TABLE public.group_members ADD CONSTRAINT unique_group_member_name UNIQUE (group_id, name);

-- 3. Recreate RLS policies for collaboration
-- Allow members to see other members in the same group
DROP POLICY IF EXISTS "Users can manage their own group members" ON public.group_members;

CREATE POLICY "Members can view other group members"
ON public.group_members FOR SELECT
USING (
  group_id IN (
    SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert members to their groups"
ON public.group_members FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT g.id FROM public.groups g WHERE g.user_id = auth.uid()
  )
  OR 
  group_id IN (
    SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete group members"
ON public.group_members FOR DELETE
USING (
  group_id IN (
    SELECT g.id FROM public.groups g WHERE g.user_id = auth.uid()
  )
);

-- 4. Recreate Group RLS for collaboration
DROP POLICY IF EXISTS "Users can manage their own groups" ON public.groups;

CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
USING (
  user_id = auth.uid()
  OR 
  id IN (
    SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can manage their groups"
ON public.groups FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
