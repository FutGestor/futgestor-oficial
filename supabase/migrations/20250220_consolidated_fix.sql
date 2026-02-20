-- ============================================
-- CONSOLIDAÇÃO DAS MIGRATIONS PENDENTES
-- Data: 2026-02-20
-- ============================================

-- ============================================
-- 1. TABELA ML_ESCALACAO_PADROES (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS ml_escalacao_padroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    formacao VARCHAR(10) NOT NULL,
    posicao_campo VARCHAR(10) NOT NULL,
    jogador_id UUID NOT NULL,
    frequencia INTEGER DEFAULT 1,
    eficiencia NUMERIC(5,2) DEFAULT 0,
    gols_por_jogo NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, formacao, posicao_campo, jogador_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_team ON ml_escalacao_padroes(team_id);
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_formacao ON ml_escalacao_padroes(formacao);

-- RLS
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas
DROP POLICY IF EXISTS "Enable read access for all users" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ml_escalacao_padroes;

CREATE POLICY "Enable read access for all users"
    ON ml_escalacao_padroes FOR SELECT
    USING (true);

CREATE POLICY "Enable all access for authenticated users"
    ON ml_escalacao_padroes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. FUNÇÕES RPC (idempotente)
-- ============================================

-- get_financial_summary
DROP FUNCTION IF EXISTS get_financial_summary(UUID);
CREATE OR REPLACE FUNCTION get_financial_summary(_team_id UUID)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_receitas', COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0)::numeric,
      'total_despesas', COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0)::numeric,
      'saldo', COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0)::numeric,
      'transacoes_count', COUNT(*)::bigint
    )
    FROM transacoes
    WHERE team_id = _team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_player_stats
DROP FUNCTION IF EXISTS get_player_stats(UUID);
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

-- get_player_performance
DROP FUNCTION IF EXISTS get_player_performance(UUID);
CREATE OR REPLACE FUNCTION get_player_performance(_jogador_id UUID)
RETURNS json AS $$
DECLARE
  v_team_id UUID;
BEGIN
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
-- 3. TRIGGER DE NOTIFICAÇÃO
-- ============================================
DROP TRIGGER IF EXISTS trg_notify_new_game ON jogos;
DROP FUNCTION IF EXISTS notify_new_game();

CREATE OR REPLACE FUNCTION notify_new_game()
RETURNS TRIGGER AS $$
DECLARE
  jogador_record RECORD;
  adversario_nome TEXT;
  v_team_nome TEXT;
BEGIN
  SELECT nome INTO v_team_nome
  FROM teams
  WHERE id = NEW.team_id;

  SELECT nome INTO adversario_nome
  FROM times
  WHERE id = NEW.time_adversario_id;
  
  FOR jogador_record IN 
    SELECT j.id as jogador_id, j.user_id
    FROM jogadores j
    WHERE j.team_id = NEW.team_id 
    AND j.ativo = true
    AND j.user_id IS NOT NULL
  LOOP
    INSERT INTO notificacoes_push (
      user_id, titulo, mensagem, tipo, dados, lida, enviada
    ) VALUES (
      jogador_record.user_id,
      'Novo jogo agendado!',
      'Um novo jogo foi agendado para ' || TO_CHAR(NEW.data_hora::TIMESTAMP, 'DD/MM/YYYY às HH24:MI') || 
        CASE WHEN adversario_nome IS NOT NULL THEN ' contra ' || adversario_nome ELSE '' END || 
        '. Confirme sua presença!',
      'confirmacao_presenca',
      jsonb_build_object('jogo_id', NEW.id, 'data_hora', NEW.data_hora, 'adversario', adversario_nome, 'time_nome', v_team_nome),
      false, false
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar notificação: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_game
  AFTER INSERT ON jogos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_game();

-- ============================================
-- 4. PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO anon;
