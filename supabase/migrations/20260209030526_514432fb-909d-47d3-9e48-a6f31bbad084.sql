
-- 1. Move cpf_responsavel to a separate protected table
CREATE TABLE public.team_sensitive_data (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  cpf_responsavel text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only team admins can view sensitive data"
ON public.team_sensitive_data FOR SELECT
USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Only team admins can manage sensitive data"
ON public.team_sensitive_data FOR ALL
USING (is_team_admin(auth.uid(), team_id));

-- Migrate existing CPF data
INSERT INTO public.team_sensitive_data (team_id, cpf_responsavel)
SELECT id, cpf_responsavel FROM public.teams WHERE cpf_responsavel IS NOT NULL;

-- Remove CPF from teams table
ALTER TABLE public.teams DROP COLUMN cpf_responsavel;

-- 2. Fix subscriptions public exposure - replace overly permissive public policy
DROP POLICY IF EXISTS "Public can view subscription plan" ON public.subscriptions;

-- Create restricted public policy that only exposes plan info (not payment IDs)
-- We use a view for public access
CREATE VIEW public.subscriptions_public
WITH (security_invoker = on) AS
  SELECT team_id, plano, status, expires_at
  FROM public.subscriptions;

GRANT SELECT ON public.subscriptions_public TO anon, authenticated;
