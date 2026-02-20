-- Adicionar campo 'ativo' na tabela teams para soft delete
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_teams_ativo ON public.teams(ativo);

-- ============================================
-- FUNÇÃO: Time se auto-excluir permanentemente
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_own_team(_team_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _user_id UUID;
    _is_admin BOOLEAN;
    _team_name TEXT;
BEGIN
    -- Pegar ID do usuário logado
    _user_id := auth.uid();
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se o time existe
    SELECT nome INTO _team_name FROM teams WHERE id = _team_id;
    IF _team_name IS NULL THEN
        RAISE EXCEPTION 'Time não encontrado';
    END IF;
    
    -- Verificar se o usuário é admin do time
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id 
        AND team_id = _team_id 
        AND role IN ('admin', 'super_admin')
    ) INTO _is_admin;
    
    IF NOT _is_admin THEN
        RAISE EXCEPTION 'Apenas administradores podem excluir o time';
    END IF;
    
    -- ============================================
    -- EXCLUSÃO EM CASCATA DE TODOS OS DADOS
    -- ============================================
    
    -- 1. Deletar jogadores e dados relacionados
    DELETE FROM presencas WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM jogador_estatisticas WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM player_achievements WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM confirmacoes_presenca WHERE team_id = _team_id;
    DELETE FROM jogadores WHERE team_id = _team_id;
    
    -- 2. Deletar jogos e resultados
    DELETE FROM estatisticas_partida WHERE resultado_id IN (
        SELECT id FROM resultados WHERE jogo_id IN (SELECT id FROM jogos WHERE team_id = _team_id)
    );
    DELETE FROM votos_destaque WHERE team_id = _team_id;
    DELETE FROM resultados WHERE jogo_id IN (SELECT id FROM jogos WHERE team_id = _team_id);
    DELETE FROM escalacao_jogadores WHERE escalacao_id IN (
        SELECT id FROM escalacoes WHERE team_id = _team_id
    );
    DELETE FROM escalacoes WHERE team_id = _team_id;
    DELETE FROM jogos WHERE team_id = _team_id;
    
    -- 3. Deletar campeonatos
    DELETE FROM campeonato_classificacao WHERE campeonato_id IN (
        SELECT id FROM campeonatos WHERE team_id = _team_id
    );
    DELETE FROM campeonato_jogos WHERE campeonato_id IN (
        SELECT id FROM campeonatos WHERE team_id = _team_id
    );
    DELETE FROM campeonatos WHERE team_id = _team_id;
    
    -- 4. Deletar comunicação
    DELETE FROM chat_mensagens WHERE team_id = _team_id;
    DELETE FROM chat_leituras WHERE team_id = _team_id;
    DELETE FROM aviso_leituras WHERE aviso_id IN (SELECT id FROM avisos WHERE team_id = _team_id);
    DELETE FROM avisos WHERE team_id = _team_id;
    
    -- 5. Deletar chamados de suporte
    DELETE FROM chamado_anexos WHERE chamado_id IN (
        SELECT id FROM chamados WHERE team_id = _team_id
    );
    DELETE FROM chamado_mensagens WHERE chamado_id IN (
        SELECT id FROM chamados WHERE team_id = _team_id
    );
    DELETE FROM chamados WHERE team_id = _team_id;
    
    -- 6. Deletar financeiro
    DELETE FROM transacoes WHERE team_id = _team_id;
    
    -- 7. Deletar notificações
    DELETE FROM notificacoes WHERE team_id = _team_id;
    
    -- 8. Deletar solicitações
    DELETE FROM solicitacoes_jogo WHERE team_id = _team_id OR time_solicitante_id = _team_id;
    
    -- 9. Deletar conquistas
    DELETE FROM conquistas WHERE team_id = _team_id;
    
    -- 10. Deletar configurações e dados auxiliares
    DELETE FROM team_config WHERE team_id = _team_id;
    DELETE FROM public_matchmaking WHERE team_id = _team_id;
    DELETE FROM link_convite WHERE team_id = _team_id;
    DELETE FROM ml_escalacao_padroes WHERE team_id = _team_id;
    
    -- 11. Deletar roles
    DELETE FROM user_roles WHERE team_id = _team_id;
    
    -- 12. Deletar times adversários (tabela times)
    DELETE FROM times WHERE team_id = _team_id;
    
    -- 13. Atualizar perfis para remover referência ao time
    UPDATE profiles SET team_id = NULL WHERE team_id = _team_id;
    
    -- 14. Finalmente, deletar o time
    DELETE FROM teams WHERE id = _team_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_team(UUID) TO authenticated;

COMMENT ON FUNCTION public.delete_own_team(UUID) IS 
'Permite que um admin exclua permanentemente seu próprio time e todos os dados associados. Requer confirmação prévia no frontend.';

-- ============================================
-- ATUALIZAR POLICY DO DISCOVERY PARA FILTRAR ATIVOS
-- ============================================

-- Policy para mostrar apenas times ativos no discovery
DROP POLICY IF EXISTS "Public can view active teams" ON public.teams;
CREATE POLICY "Public can view active teams"
  ON public.teams FOR SELECT
  USING (ativo = true);

-- Policy para admins verem seus times (ativos ou não)
DROP POLICY IF EXISTS "Members can view own team" ON public.teams;
CREATE POLICY "Members can view own team"
  ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    OR ativo = true
  );
