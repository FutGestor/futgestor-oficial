-- ============================================
-- CORREÇÃO DAS NOTIFICAÇÕES (v2)
-- ============================================

-- ============================================
-- 1. RECRIAR O TRIGGER DE NOTIFICAÇÃO
-- ============================================

-- Remover trigger e função existentes
DROP TRIGGER IF EXISTS trg_notify_new_game ON jogos;
DROP FUNCTION IF EXISTS notify_new_game();

-- Criar função de notificação corrigida
CREATE OR REPLACE FUNCTION notify_new_game()
RETURNS TRIGGER AS $$
DECLARE
  jogador_record RECORD;
  adversario_nome TEXT;
  v_team_nome TEXT;
BEGIN
  -- Buscar nome do time
  SELECT nome INTO v_team_nome
  FROM teams
  WHERE id = NEW.team_id;

  -- Buscar nome do adversário se existir
  SELECT nome INTO adversario_nome
  FROM times
  WHERE id = NEW.time_adversario_id;
  
  -- Para cada jogador ativo do time que tenha user_id vinculado
  FOR jogador_record IN 
    SELECT j.id as jogador_id, j.user_id
    FROM jogadores j
    WHERE j.team_id = NEW.team_id 
    AND j.ativo = true
    AND j.user_id IS NOT NULL
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
        'adversario', adversario_nome,
        'time_nome', v_team_nome
      ),
      false,
      false
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (pode ser visto nos logs do Supabase)
    RAISE WARNING 'Erro ao criar notificação: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trg_notify_new_game
  AFTER INSERT ON jogos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_game();

-- ============================================
-- 2. RLS PARA NOTIFICAÇÕES
-- ============================================

-- Garantir que RLS está ativo
ALTER TABLE notificacoes_push ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Usuários veem apenas suas notificações" ON notificacoes_push;
DROP POLICY IF EXISTS "Usuários inserem suas próprias notificações" ON notificacoes_push;
DROP POLICY IF EXISTS "Usuários atualizam suas próprias notificações" ON notificacoes_push;
DROP POLICY IF EXISTS "Trigger pode inserir notificações" ON notificacoes_push;

-- Criar políticas
CREATE POLICY "Usuários veem apenas suas notificações" 
    ON notificacoes_push FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas próprias notificações" 
    ON notificacoes_push FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política especial para permitir que o trigger insira notificações
CREATE POLICY "Trigger pode inserir notificações"
    ON notificacoes_push FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 3. VERIFICAR JOGADORES SEM USER_ID
-- ============================================
-- Execute esta query para ver quais jogadores não têm user_id:
-- 
-- SELECT j.id, j.nome, j.email, j.user_id, j.team_id
-- FROM jogadores j
-- WHERE j.ativo = true
-- ORDER BY j.team_id, j.nome;
--
-- Para vincular jogadores existentes aos usuários:
-- UPDATE jogadores j
-- SET user_id = u.id
-- FROM auth.users u
-- WHERE j.email = u.email
-- AND j.user_id IS NULL;
