
-- Table to log every SaaS payment for the super admin dashboard
CREATE TABLE public.saas_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  plano text NOT NULL,
  valor numeric NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  metodo text DEFAULT 'pix',
  mp_payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only super_admin can read this table
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read saas_payments"
  ON public.saas_payments
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Allow service role (edge functions) to insert - no restrictive policy for INSERT
-- Edge functions use service_role key which bypasses RLS

-- Add super_admin read access to subscriptions (to see all subscriptions)
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_saas_payments_created_at ON public.saas_payments(created_at DESC);
CREATE INDEX idx_saas_payments_team_id ON public.saas_payments(team_id);
