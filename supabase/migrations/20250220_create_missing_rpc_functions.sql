-- ============================================
-- CORREÇÕES E FUNÇÕES RPC FALTANTES
-- ============================================

-- ============================================
-- 1. REMOVER FUNÇÕES EXISTENTES (para evitar conflito de tipos)
-- ============================================

DROP FUNCTION IF EXISTS get_player_stats(UUID);
DROP FUNCTION IF EXISTS get_player_performance(UUID);
DROP FUNCTION IF EXISTS get_financial_summary(UUID);

-- ============================================
-- 2. CORRIGIR FUNÇÃO DE NOTIFICAÇÃO EXISTENTE
-- ============================================

-- Atualizar função existente para usar team_id em vez de time_id
CREATE OR REPLACE FUNCTION criar_notificacao_escalacao_pendente()
RETURNS TRIGGER AS $$
DECLARE
  adversario_nome TEXT;
BEGIN
    -- Buscar nome do adversário se existir
    SELECT nome INTO adversario_nome
    FROM times
    WHERE id = NEW.time_adversario_id;
    
    -- Notificar admins do time quando um jogo é criado sem escalação
    INSERT INTO notificacoes_push (user_id, titulo, mensagem, tipo, dados)
    SELECT 
        p.id,
        'Escalação Pendente',
        'O jogo ' || 
          CASE 
            WHEN adversario_nome IS NOT NULL THEN 'contra ' || adversario_nome
            ELSE 'agendado'
          END || 
          ' precisa de uma escalação!',
        'escalacao_pendente',
        jsonb_build_object('jogo_id', NEW.id, 'data_hora', NEW.data_hora)
    FROM profiles p
    WHERE p.team_id = NEW.team_id 
    AND p.is_admin = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. FUNÇÕES RPC FALTANTES
-- ============================================

-- 3.1 get_player_stats - Estatísticas agregadas de jogadores
CREATE OR REPLACE FUNCTION get_player_stats(_team_id UUID)
RETURNS TABLE (
  jogador_id UUID,
  jogos BIGINT,
  gols BIGINT,
  assistencias BIGINT,
  cartoes_amarelos BIGINT,
  cartoes_vermelhos BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.jogador_id,
    COUNT(*)::BIGINT as jogos,
    COALESCE(SUM(ep.gols), 0)::BIGINT as gols,
    COALESCE(SUM(ep.assistencias), 0)::BIGINT as assistencias,
    COALESCE(SUM(CASE WHEN ep.cartao_amarelo THEN 1 ELSE 0 END), 0)::BIGINT as cartoes_amarelos,
    COALESCE(SUM(CASE WHEN ep.cartao_vermelho THEN 1 ELSE 0 END), 0)::BIGINT as cartoes_vermelhos
  FROM estatisticas_partida ep
  JOIN resultados r ON r.id = ep.resultado_id
  WHERE r.team_id = _team_id
  GROUP BY ep.jogador_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 get_player_performance - Performance detalhada de um jogador
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

-- 3.3 get_financial_summary - Resumo financeiro do time
CREATE OR REPLACE FUNCTION get_financial_summary(_team_id UUID)
RETURNS TABLE (
  total_receitas NUMERIC,
  total_despesas NUMERIC,
  saldo NUMERIC,
  transacoes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0)::NUMERIC as total_receitas,
    COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0)::NUMERIC as total_despesas,
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE -t.valor END), 0)::NUMERIC as saldo,
    COUNT(*)::BIGINT as transacoes_count
  FROM transacoes t
  WHERE t.team_id = _team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. TRIGGER PARA NOTIFICAÇÃO DE NOVO JOGO
-- ============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trg_notify_new_game ON jogos;

-- Função para criar notificação quando um jogo é criado
CREATE OR REPLACE FUNCTION notify_new_game()
RETURNS TRIGGER AS $$
DECLARE
  jogador_record RECORD;
  adversario_nome TEXT;
BEGIN
  -- Buscar nome do adversário se existir
  SELECT nome INTO adversario_nome
  FROM times
  WHERE id = NEW.time_adversario_id;
  
  -- Para cada jogador ativo do time, criar notificação
  FOR jogador_record IN 
    SELECT j.id as jogador_id, u.id as user_id
    FROM jogadores j
    LEFT JOIN auth.users u ON u.email = j.email
    WHERE j.team_id = NEW.team_id 
    AND j.ativo = true
    AND u.id IS NOT NULL
  LOOP
    INSERT INTO notificacoes_push (
      user_id,
      titulo,
      mensagem,
      tipo,
      dados,
      lida,
      enviada
    ) VALUES (
      jogador_record.user_id,
      'Novo jogo agendado!',
      'Um novo jogo foi agendado para ' || TO_CHAR(NEW.data_hora::TIMESTAMP, 'DD/MM/YYYY às HH24:MI') || 
        CASE 
          WHEN adversario_nome IS NOT NULL THEN ' contra ' || adversario_nome
          ELSE ''
        END || '. Confirme sua presença!',
      'confirmacao_presenca',
      jsonb_build_object(
        'jogo_id', NEW.id,
        'data_hora', NEW.data_hora,
        'adversario', adversario_nome
      ),
      false,
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trg_notify_new_game
  AFTER INSERT ON jogos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_game();

-- ============================================
-- 5. PERMISSÕES PARA FUNÇÕES RPC
-- ============================================

-- Garantir que as funções possam ser executadas por usuários autenticados
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_performance(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO anon;
