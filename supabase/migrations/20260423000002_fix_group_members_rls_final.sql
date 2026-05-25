
-- 1. Drop ALL existing problematic policies on group_members
DROP POLICY IF EXISTS "Group owners and members can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view other group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage their own group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert members to their groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can delete group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage their own group membership" ON public.group_members;

-- 2. Create helper function (SECURITY DEFINER) to break recursion
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

-- 3. Create ONLY ONE clean SELECT policy
CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
USING (
  public.is_member_of(group_id)
);

-- 4. Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
