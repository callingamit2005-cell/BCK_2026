
-- Create group_invites table
CREATE TABLE public.group_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Admin can manage invites for their groups
CREATE POLICY "Admins can insert invites"
ON public.group_invites
FOR INSERT
WITH CHECK (auth.uid() = invited_by);

-- Admin can view invites for their groups
CREATE POLICY "Admins can view group invites"
ON public.group_invites
FOR SELECT
USING (
  invited_by = auth.uid()
  OR group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

-- Admin can update invite status
CREATE POLICY "Users can update invites"
ON public.group_invites
FOR UPDATE
USING (
  invited_by = auth.uid()
  OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Unique constraint to prevent duplicate invites
CREATE UNIQUE INDEX idx_group_invites_unique ON public.group_invites (group_id, email) WHERE status = 'pending';
