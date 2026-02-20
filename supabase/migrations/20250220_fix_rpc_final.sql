-- ============================================
-- CORREÇÃO FINAL DAS FUNÇÕES RPC
-- ============================================

-- Remover funções existentes
DROP FUNCTION IF EXISTS get_financial_summary(UUID);
DROP FUNCTION IF EXISTS get_player_stats(UUID);
DROP FUNCTION IF EXISTS get_player_performance(UUID);

-- ============================================
-- 1. get_financial_summary - Retorna SETOF
-- ============================================
CREATE OR REPLACE FUNCTION get_financial_summary(_team_id UUID)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT to_json(t)
  FROM (
    SELECT 
      COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)::numeric as total_receitas,
      COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)::numeric as total_despesas,
      COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0)::numeric as saldo,
      COUNT(*)::bigint as transacoes_count
    FROM transacoes
    WHERE team_id = _team_id
  ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. get_player_stats - Retorna SETOF
-- ============================================
CREATE OR REPLACE FUNCTION get_player_stats(_team_id UUID)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT to_json(t)
  FROM (
    SELECT 
      ep.jogador_id::text,
      COUNT(*)::bigint as jogos,
      COALESCE(SUM(ep.gols), 0)::bigint as gols,
      COALESCE(SUM(ep.assistencias), 0)::bigint as assistencias,
      COALESCE(SUM(CASE WHEN ep.cartao_amarelo THEN 1 ELSE 0 END), 0)::bigint as cartoes_amarelos,
      COALESCE(SUM(CASE WHEN ep.cartao_vermelho THEN 1 ELSE 0 END), 0)::bigint as cartoes_vermelhos
    FROM estatisticas_partida ep
    JOIN resultados r ON r.id = ep.resultado_id
    WHERE r.team_id = _team_id
    GROUP BY ep.jogador_id
  ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. get_player_performance - Retorna objeto JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_player_performance(_jogador_id UUID)
RETURNS json AS $$
DECLARE
  v_team_id UUID;
  player_stats json;
  team_stats json;
BEGIN
  -- Buscar team_id do jogador
  SELECT team_id INTO v_team_id
  FROM jogadores
  WHERE id = _jogador_id;

  -- Buscar stats do jogador
  SELECT COALESCE(json_agg(
    json_build_object(
      'gols', ep.gols,
      'assistencias', ep.assistencias,
      'participou', ep.participou,
      'cartao_amarelo', ep.cartao_amarelo,
      'cartao_vermelho', ep.cartao_vermelho,
      'resultado', json_build_object(
        'mvp_jogador_id', r.mvp_jogador_id,
        'jogo', json_build_object('data_hora', j.data_hora)
      )
    )
  ), '[]'::json)
  INTO player_stats
  FROM estatisticas_partida ep
  JOIN resultados r ON r.id = ep.resultado_id
  JOIN jogos j ON j.id = r.jogo_id
  WHERE ep.jogador_id = _jogador_id;

  -- Buscar stats do time
  SELECT COALESCE(json_agg(
    json_build_object(
      'gols', ep.gols,
      'assistencias', ep.assistencias,
      'participou', ep.participou,
      'jogador_id', ep.jogador_id
    )
  ), '[]'::json)
  INTO team_stats
  FROM estatisticas_partida ep
  JOIN resultados r ON r.id = ep.resultado_id
  WHERE r.team_id = v_team_id;

  RETURN json_build_object(
    'playerStats', player_stats,
    'teamStats', team_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO anon;
