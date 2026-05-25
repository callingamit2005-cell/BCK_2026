
-- Migration: fix_member_policy
-- Description: Updates group_members policy to allow group owners to manage all members.
-- This is required because members now have unique random user_ids for ledger accuracy.

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own group members" ON public.group_members;

-- Create new comprehensive policy
CREATE POLICY "Group owners and members can manage group members"
ON public.group_members FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_members.group_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_members.group_id 
    AND user_id = auth.uid()
  )
);
