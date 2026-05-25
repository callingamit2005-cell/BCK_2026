
-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 2,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own groups"
ON public.groups FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own group members"
ON public.group_members FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Group expenses table
CREATE TABLE public.group_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC NOT NULL,
  paid_by TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own group expenses"
ON public.group_expenses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
