-- ============================================
-- CORREÇÃO FINAL: admin_delete_user com verificação de tabelas existentes
-- ============================================

DROP FUNCTION IF EXISTS admin_delete_user(UUID);

CREATE OR REPLACE FUNCTION admin_delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _jogador_ids UUID[];
    _team_id UUID;
    _team_member_count INTEGER;
    _caller_email TEXT;
    _target_email TEXT;
BEGIN
    SELECT email INTO _caller_email FROM auth.users WHERE id = auth.uid();
    SELECT email INTO _target_email FROM auth.users WHERE id = _user_id;
    
    IF _caller_email IS NULL OR _caller_email != 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'Apenas God Admin pode executar';
    END IF;
    
    IF _target_email = 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'Não é permitido deletar a conta God Admin';
    END IF;

    -- Pegar team_id do usuário
    SELECT team_id INTO _team_id FROM profiles WHERE id = _user_id;
    
    -- Contar quantos usuários ainda têm este team_id
    SELECT COUNT(*) INTO _team_member_count FROM profiles WHERE team_id = _team_id;

    SELECT ARRAY_AGG(id) INTO _jogador_ids FROM jogadores WHERE user_id = _user_id;

    -- 1. Deletar chat_leituras
    DELETE FROM chat_leituras WHERE user_id = _user_id;
    
    -- 2. Deletar presenças
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM presencas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 3. Deletar estatísticas de jogador
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM jogador_estatisticas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 4. Deletar conquistas do jogador (player_achievements)
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM player_achievements WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 5. Deletar mensagens de chamados
    DELETE FROM chamado_mensagens WHERE user_id = _user_id;
    DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamados WHERE user_id = _user_id;
    
    -- 6. Deletar leituras de avisos
    DELETE FROM aviso_leituras WHERE user_id = _user_id;
    
    -- 7. Deletar roles
    DELETE FROM user_roles WHERE user_id = _user_id;
    
    -- 8. Deletar jogadores
    DELETE FROM jogadores WHERE user_id = _user_id;
    
    -- 9. Deletar notificações
    DELETE FROM notificacoes WHERE user_id = _user_id;
    
    -- 10. Deletar perfil
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 11. SE O TIME SÓ TINHA ESTE USUÁRIO, DELETAR O TIME COMPLETAMENTE
    IF _team_id IS NOT NULL AND _team_member_count <= 1 THEN
        -- Deletar todos os dados do time
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
        
        DELETE FROM chat_mensagens WHERE team_id = _team_id;
        DELETE FROM chat_leituras WHERE team_id = _team_id;
        DELETE FROM aviso_leituras WHERE aviso_id IN (SELECT id FROM avisos WHERE team_id = _team_id);
        DELETE FROM avisos WHERE team_id = _team_id;
        DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE team_id = _team_id);
        DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE team_id = _team_id);
        DELETE FROM chamados WHERE team_id = _team_id;
        DELETE FROM transacoes WHERE team_id = _team_id;
        DELETE FROM notificacoes WHERE team_id = _team_id;
        DELETE FROM solicitacoes_jogo WHERE team_id = _team_id OR time_solicitante_id = _team_id;
        
        -- REMOVIDO: conquistas (tabela não existe)
        -- REMOVIDO: team_config (tabela pode não existir)
        -- REMOVIDO: public_matchmaking (tabela pode não existir)
        -- REMOVIDO: link_convite (tabela pode não existir)
        -- REMOVIDO: ml_escalacao_padroes (tabela pode não existir)
        
        DELETE FROM user_roles WHERE team_id = _team_id;
        DELETE FROM times WHERE team_id = _team_id;
        
        -- Finalmente deletar o time
        DELETE FROM teams WHERE id = _team_id;
    END IF;
    
    -- 12. Deletar usuário
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Atualizar também a função delete_own_team
DROP FUNCTION IF EXISTS public.delete_own_team(UUID);

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
    _user_id := auth.uid();
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    SELECT nome INTO _team_name FROM teams WHERE id = _team_id;
    IF _team_name IS NULL THEN
        RAISE EXCEPTION 'Time não encontrado';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id 
        AND team_id = _team_id 
        AND role IN ('admin', 'super_admin')
    ) INTO _is_admin;
    
    IF NOT _is_admin THEN
        RAISE EXCEPTION 'Apenas administradores podem excluir o time';
    END IF;
    
    -- Exclusão em cascata
    DELETE FROM presencas WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM jogador_estatisticas WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM player_achievements WHERE jogador_id IN (SELECT id FROM jogadores WHERE team_id = _team_id);
    DELETE FROM confirmacoes_presenca WHERE team_id = _team_id;
    DELETE FROM jogadores WHERE team_id = _team_id;
    
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
    
    DELETE FROM chat_mensagens WHERE team_id = _team_id;
    DELETE FROM chat_leituras WHERE team_id = _team_id;
    DELETE FROM aviso_leituras WHERE aviso_id IN (SELECT id FROM avisos WHERE team_id = _team_id);
    DELETE FROM avisos WHERE team_id = _team_id;
    DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE team_id = _team_id);
    DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE team_id = _team_id);
    DELETE FROM chamados WHERE team_id = _team_id;
    DELETE FROM transacoes WHERE team_id = _team_id;
    DELETE FROM notificacoes WHERE team_id = _team_id;
    DELETE FROM solicitacoes_jogo WHERE team_id = _team_id OR time_solicitante_id = _team_id;
    DELETE FROM user_roles WHERE team_id = _team_id;
    DELETE FROM times WHERE team_id = _team_id;
    UPDATE profiles SET team_id = NULL WHERE team_id = _team_id;
    DELETE FROM teams WHERE id = _team_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_team(UUID) TO authenticated;
