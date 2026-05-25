
-- 1. Harden membership and admin check functions
CREATE OR REPLACE FUNCTION public.is_member_of(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id
    AND gm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  );
$$;

-- 2. Harden groups policies
DROP POLICY IF EXISTS "Safe group access" ON public.groups;
CREATE POLICY "Safe group access"
ON public.groups
FOR SELECT
USING (
  groups.user_id = auth.uid() 
  OR 
  public.is_member_of(groups.id)
);

DROP POLICY IF EXISTS "Owners can manage their groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
CREATE POLICY "Admins can manage groups"
ON public.groups
FOR ALL
USING (
  groups.user_id = auth.uid() 
  OR 
  public.is_admin_of(groups.id)
)
WITH CHECK (
  groups.user_id = auth.uid() 
  OR 
  public.is_admin_of(groups.id)
);

-- 3. Harden group_expenses policies
DROP POLICY IF EXISTS "Users can manage their own group expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Group members can view expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Admins and owners can manage expenses" ON public.group_expenses;

CREATE POLICY "Group members can view expenses"
ON public.group_expenses
FOR SELECT
USING (
  public.is_member_of(group_expenses.group_id)
);

CREATE POLICY "Users can insert expenses"
ON public.group_expenses
FOR INSERT
WITH CHECK (
  group_expenses.user_id = auth.uid() 
  AND group_expenses.group_id IS NOT NULL
  AND public.is_member_of(group_expenses.group_id)
);

CREATE POLICY "Admins and owners can manage expenses"
ON public.group_expenses
FOR ALL
USING (
  group_expenses.user_id = auth.uid()
  OR
  public.is_admin_of(group_expenses.group_id)
)
WITH CHECK (
  group_expenses.user_id = auth.uid()
  OR
  public.is_admin_of(group_expenses.group_id)
);
