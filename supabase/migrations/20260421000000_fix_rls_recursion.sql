
-- Migration: fix_rls_recursion
-- Description: Breaks the infinite recursion loop between groups and group_members RLS policies.
-- Using SECURITY DEFINER functions to safely check membership/ownership without triggering recursion.

-- 1. Create helper functions
CREATE OR REPLACE FUNCTION public.check_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.check_is_group_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Fix Group Policies
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can manage their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON public.groups;

CREATE POLICY "Users can view groups they belong to"
ON public.groups FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  public.check_is_group_member(id)
);

CREATE POLICY "Owners can manage their groups"
ON public.groups FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Fix Group Members Policies
DROP POLICY IF EXISTS "Group owners and members can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view other group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage their own group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert members to their groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can delete group members" ON public.group_members;

CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  public.check_is_group_member(group_id)
  OR
  public.check_is_group_owner(group_id)
);

CREATE POLICY "Group owners can manage members"
ON public.group_members FOR ALL
USING (public.check_is_group_owner(group_id))
WITH CHECK (public.check_is_group_owner(group_id));

CREATE POLICY "Users can manage their own membership"
ON public.group_members FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
