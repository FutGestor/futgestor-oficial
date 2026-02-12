
-- Drop existing view
DROP VIEW IF EXISTS public.jogadores_public;

-- Create public view for jogadores WITHOUT security_invoker = on
-- This allows the view to be accessible even if the underlying table is restricted by RLS,
-- but only returns the columns we explicitly select (excluding private ones like email/phone).
CREATE VIEW public.jogadores_public AS
  SELECT id, nome, apelido, posicao, foto_url, numero, team_id, ativo
  FROM public.jogadores
  WHERE ativo = true;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.jogadores_public TO anon, authenticated;
