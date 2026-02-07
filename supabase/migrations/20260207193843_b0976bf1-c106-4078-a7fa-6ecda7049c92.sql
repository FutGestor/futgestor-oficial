
-- 1) Create a public view for jogadores with only safe columns
CREATE VIEW public.jogadores_public
WITH (security_invoker = on) AS
  SELECT id, nome, apelido, posicao, foto_url, numero, team_id, ativo
  FROM public.jogadores;

-- 2) Drop the overly permissive public SELECT policy on jogadores
DROP POLICY IF EXISTS "Public can view jogadores by team" ON public.jogadores;

-- 3) Add ip_address column to solicitacoes_jogo for rate limiting
ALTER TABLE public.solicitacoes_jogo ADD COLUMN IF NOT EXISTS ip_address text;

-- 4) Create a function to check rate limit (max 3 per IP per 24h)
CREATE OR REPLACE FUNCTION public.check_solicitacao_rate_limit(p_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    SELECT count(*)
    FROM public.solicitacoes_jogo
    WHERE ip_address = p_ip
      AND created_at > now() - interval '24 hours'
  ) < 3;
$$;
