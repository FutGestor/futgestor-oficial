-- Aumentar o limite de solicitações por IP para permitir mais testes e uso real
-- Alterando de 3 para 20 solicitações por 24 horas
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
  ) < 20;
$$;

COMMENT ON FUNCTION public.check_solicitacao_rate_limit IS 'Verifica se o IP atingiu o limite de 20 solicitações em 24 horas';
