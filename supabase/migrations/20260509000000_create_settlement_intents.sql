-- 20260509000000_create_settlement_intents.sql
-- 🛠️ Phase 2: Payment Orchestration System
-- Objective: Track P2P settlement lifecycles with authoritative backend verification.

CREATE TYPE settlement_status AS ENUM ('created', 'redirected', 'pending_verification', 'success', 'failed');

CREATE TABLE IF NOT EXISTS public.settlement_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.group_members(id),
    receiver_id uuid NOT NULL REFERENCES public.group_members(id),
    amount numeric NOT NULL CHECK (amount > 0),
    currency text DEFAULT 'INR',
    status settlement_status DEFAULT 'created',
    payment_method text DEFAULT 'upi',
    metadata jsonb DEFAULT '{}'::jsonb,
    idempotency_key text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 🛡️ RLS POLICIES
ALTER TABLE public.settlement_intents ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view intents related to their groups
CREATE POLICY "Members can view group settlement intents" ON public.settlement_intents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = settlement_intents.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Policy: Senders can create intents
CREATE POLICY "Senders can create settlement intents" ON public.settlement_intents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.id = settlement_intents.sender_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Policy: Senders can update their own intents (lifecycle transitions)
CREATE POLICY "Senders can update settlement intents" ON public.settlement_intents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.id = settlement_intents.sender_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 🛡️ TRIGGER: Automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settlement_intents_updated_at
    BEFORE UPDATE ON public.settlement_intents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
