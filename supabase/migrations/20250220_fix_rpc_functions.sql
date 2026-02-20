-- ============================================
-- CORREÇÃO DAS FUNÇÕES RPC
-- ============================================

-- Remover funções existentes
DROP FUNCTION IF EXISTS get_financial_summary(UUID);
DROP FUNCTION IF EXISTS get_player_stats(UUID);
DROP FUNCTION IF EXISTS get_player_performance(UUID);

-- ============================================
-- 1. get_financial_summary - Retorna JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_financial_summary(_team_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_receitas', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0),
    'total_despesas', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0),
    'saldo', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE -t.valor END), 0),
    'transacoes_count', COUNT(*)::BIGINT
  ) INTO result
  FROM transacoes t
  WHERE t.team_id = _team_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. get_player_stats - Retorna JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_player_stats(_team_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'jogador_id', ep.jogador_id,
    'jogos', COUNT(*)::BIGINT,
    'gols', COALESCE(SUM(ep.gols), 0)::BIGINT,
    'assistencias', COALESCE(SUM(ep.assistencias), 0)::BIGINT,
    'cartoes_amarelos', COALESCE(SUM(CASE WHEN ep.cartao_amarelo THEN 1 ELSE 0 END), 0)::BIGINT,
    'cartoes_vermelhos', COALESCE(SUM(CASE WHEN ep.cartao_vermelho THEN 1 ELSE 0 END), 0)::BIGINT
  )), '[]'::json) INTO result
  FROM estatisticas_partida ep
  JOIN resultados r ON r.id = ep.resultado_id
  WHERE r.team_id = _team_id
  GROUP BY ep.jogador_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. get_player_performance - Retorna JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_player_performance(_jogador_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_team_id UUID;
BEGIN
  -- Buscar team_id do jogador
  SELECT team_id INTO v_team_id
  FROM jogadores
  WHERE id = _jogador_id;

  SELECT json_build_object(
    'playerStats', COALESCE((
      SELECT json_agg(json_build_object(
        'gols', ep.gols,
        'assistencias', ep.assistencias,
        'participou', ep.participou,
        'cartao_amarelo', ep.cartao_amarelo,
        'cartao_vermelho', ep.cartao_vermelho,
        'resultado', json_build_object(
          'mvp_jogador_id', r.mvp_jogador_id,
          'jogo', json_build_object(
            'data_hora', j.data_hora
          )
        )
      ))
      FROM estatisticas_partida ep
      JOIN resultados r ON r.id = ep.resultado_id
      JOIN jogos j ON j.id = r.jogo_id
      WHERE ep.jogador_id = _jogador_id
    ), '[]'::json),
    'teamStats', COALESCE((
      SELECT json_agg(json_build_object(
        'gols', ep.gols,
        'assistencias', ep.assistencias,
        'participou', ep.participou,
        'jogador_id', ep.jogador_id
      ))
      FROM estatisticas_partida ep
      JOIN resultados r ON r.id = ep.resultado_id
      WHERE r.team_id = v_team_id
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
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
