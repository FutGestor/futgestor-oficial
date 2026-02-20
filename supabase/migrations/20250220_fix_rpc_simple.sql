-- ============================================
-- CORREÇÃO SIMPLIFICADA DAS FUNÇÕES RPC
-- ============================================

-- Remover funções existentes
DROP FUNCTION IF EXISTS get_financial_summary(UUID);
DROP FUNCTION IF EXISTS get_player_stats(UUID);
DROP FUNCTION IF EXISTS get_player_performance(UUID);

-- ============================================
-- 1. get_financial_summary - Retorna objeto único
-- ============================================
CREATE OR REPLACE FUNCTION get_financial_summary(_team_id UUID)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_receitas', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)::numeric,
      'total_despesas', COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)::numeric,
      'saldo', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0)::numeric,
      'transacoes_count', COUNT(*)::bigint
    )
    FROM transacoes
    WHERE team_id = _team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. get_player_stats - Retorna array
-- ============================================
CREATE OR REPLACE FUNCTION get_player_stats(_team_id UUID)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'jogador_id', ep.jogador_id,
        'jogos', COUNT(*)::bigint,
        'gols', COALESCE(SUM(ep.gols), 0)::bigint,
        'assistencias', COALESCE(SUM(ep.assistencias), 0)::bigint,
        'cartoes_amarelos', COALESCE(SUM(CASE WHEN ep.cartao_amarelo THEN 1 ELSE 0 END), 0)::bigint,
        'cartoes_vermelhos', COALESCE(SUM(CASE WHEN ep.cartao_vermelho THEN 1 ELSE 0 END), 0)::bigint
      )
      ORDER BY COUNT(*) DESC
    ), '[]'::json)
    FROM estatisticas_partida ep
    JOIN resultados r ON r.id = ep.resultado_id
    WHERE r.team_id = _team_id
    GROUP BY ep.jogador_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. get_player_performance - Retorna objeto
-- ============================================
CREATE OR REPLACE FUNCTION get_player_performance(_jogador_id UUID)
RETURNS json AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Buscar team_id do jogador
  SELECT team_id INTO v_team_id
  FROM jogadores
  WHERE id = _jogador_id;

  RETURN json_build_object(
    'playerStats', COALESCE((
      SELECT json_agg(json_build_object(
        'gols', ep.gols,
        'assistencias', ep.assistencias,
        'participou', ep.participou,
        'cartao_amarelo', ep.cartao_amarelo,
        'cartao_vermelho', ep.cartao_vermelho,
        'resultado', json_build_object(
          'mvp_jogador_id', r.mvp_jogador_id,
          'jogo', json_build_object('data_hora', j.data_hora)
        )
      ) ORDER BY j.data_hora DESC)
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
