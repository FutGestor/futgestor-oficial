-- RPC para calcular a saúde engagement dos times do SaaS
-- Retorna métricas de atividade recente para alertar sobre possível churn

CREATE OR REPLACE FUNCTION public.get_teams_health_metrics()
RETURNS TABLE (
  team_id UUID,
  team_nome TEXT,
  team_slug TEXT,
  plano TEXT,
  total_jogadores BIGINT,
  ultima_escalacao TIMESTAMPTZ,
  ultimo_resultado TIMESTAMPTZ,
  ultima_transacao TIMESTAMPTZ,
  health_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas Super Admins podem rodar esta query global
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. SuperAdmin role required.';
  END IF;

  RETURN QUERY
  WITH last_activities AS (
    SELECT 
      t.id as tid,
      (SELECT MAX(created_at) FROM public.escalacoes WHERE team_id = t.id) as last_esc,
      (SELECT MAX(created_at) FROM public.resultados WHERE team_id = t.id) as last_res,
      (SELECT MAX(created_at) FROM public.transacoes WHERE team_id = t.id) as last_tra,
      (SELECT COUNT(*) FROM public.jogadores WHERE team_id = t.id) as count_jog
    FROM public.teams t
  )
  SELECT 
    t.id,
    t.nome,
    t.slug,
    t.plano,
    COALESCE(la.count_jog, 0) as total_jogadores,
    la.last_esc,
    la.last_res,
    la.last_tra,
    -- Algoritmo Blindado: Soma protegida por COALESCE em cada parcela
    (
      COALESCE((
        CASE 
          WHEN la.last_esc > NOW() - INTERVAL '7 days' THEN 40
          WHEN la.last_esc > NOW() - INTERVAL '14 days' THEN 20
          ELSE 0 
        END
      ), 0) +
      COALESCE((
        CASE 
          WHEN la.last_res > NOW() - INTERVAL '7 days' THEN 30
          WHEN la.last_res > NOW() - INTERVAL '14 days' THEN 15
          ELSE 0 
        END
      ), 0) +
      COALESCE((
        CASE 
          WHEN la.last_tra > NOW() - INTERVAL '15 days' THEN 30
          WHEN la.last_tra > NOW() - INTERVAL '30 days' THEN 15
          ELSE 0 
        END
      ), 0)
    )::INTEGER as health_score
  FROM public.teams t
  JOIN last_activities la ON t.id = la.tid
  ORDER BY health_score ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teams_health_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teams_health_metrics() TO service_role;
