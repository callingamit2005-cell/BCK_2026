
-- Migration: safe_group_access_v2
-- Objective: Fix groups not returning by ensuring safe member-based access.

-- 1. Create a safe membership check function (SECURITY DEFINER to break recursion)
CREATE OR REPLACE FUNCTION public.is_member_of(p_group_id uuid)
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

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Safe group access" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

-- 3. Implement the requested safe access policy
CREATE POLICY "Safe group access"
ON public.groups
FOR SELECT
USING (
  user_id = auth.uid() -- Owner access
  OR 
  public.is_member_of(id) -- Member access
);

-- 4. Ensure group_members also has a safe policy
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members"
ON public.group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  public.is_member_of(group_id)
);

-- 5. Data fix: Link orphaned groups to their owners in the members table if missing
INSERT INTO public.group_members (group_id, user_id, name, role)
SELECT id, user_id, 'Owner', 'admin'
FROM public.groups
ON CONFLICT (group_id, user_id) DO NOTHING;
