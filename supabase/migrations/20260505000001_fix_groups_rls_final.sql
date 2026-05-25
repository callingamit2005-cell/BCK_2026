-- Migration: fix_groups_rls_final
-- Description: Ensures group members can see groups they belong to.

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Safe group access" ON public.groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

-- 2. Create updated policy for owner and member access
CREATE POLICY "Users can view groups they belong to"
ON public.groups
FOR SELECT
USING (
  user_id = auth.uid() -- Owner access
  OR 
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  ) -- Member access
);
