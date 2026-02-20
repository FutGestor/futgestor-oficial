-- Corrigir função delete_player_permanent para limpar todas as referências
-- Incluindo chat_leituras que estava causando erro de foreign key

CREATE OR REPLACE FUNCTION delete_player_permanent(_player_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _user_id UUID;
    _team_id UUID;
    _caller_id UUID;
    _caller_team_id UUID;
BEGIN
    -- Obter ID do usuário chamador
    _caller_id := auth.uid();
    
    -- Verificar se o chamador é admin do time do jogador
    SELECT t.id INTO _caller_team_id 
    FROM profiles p
    JOIN teams t ON t.id = p.team_id
    WHERE p.id = _caller_id;
    
    -- Obter user_id e team_id do jogador a ser deletado
    SELECT user_id, team_id INTO _user_id, _team_id
    FROM jogadores
    WHERE id = _player_id;
    
    -- Verificar permissões: apenas admin do mesmo time ou super_admin
    IF NOT (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = _caller_id AND role = 'super_admin')
        OR (_caller_team_id = _team_id AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = _caller_id AND role = 'admin'))
    ) THEN
        RAISE EXCEPTION 'Permissão negada: você não pode deletar jogadores de outros times';
    END IF;
    
    -- Se o jogador tem usuário vinculado, precisamos deletar as referências do usuário
    IF _user_id IS NOT NULL THEN
        -- 1. Deletar chat_leituras (causando o erro atual)
        DELETE FROM chat_leituras WHERE user_id = _user_id;
        
        -- 2. Deletar mensagens de chat
        DELETE FROM chat_mensagens WHERE user_id = _user_id;
        
        -- 3. Deletar presenças
        DELETE FROM presencas WHERE jogador_id = _player_id;
        
        -- 4. Deletar estatísticas
        DELETE FROM estatisticas_partida WHERE jogador_id = _player_id;
        
        -- 5. Deletar conquistas
        DELETE FROM player_achievements WHERE jogador_id = _player_id;
        
        -- 6. Deletar mensagens de chamados
        DELETE FROM chamado_mensagens WHERE user_id = _user_id;
        DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
        DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
        DELETE FROM chamados WHERE user_id = _user_id;
        
        -- 7. Deletar leituras de avisos
        DELETE FROM aviso_leituras WHERE user_id = _user_id;
        
        -- 8. Deletar notificações
        DELETE FROM notificacoes WHERE user_id = _user_id;
        
        -- 9. Deletar roles
        DELETE FROM user_roles WHERE user_id = _user_id;
        
        -- 10. Deletar perfil
        DELETE FROM profiles WHERE id = _user_id;
        
        -- 11. Deletar usuário auth
        DELETE FROM auth.users WHERE id = _user_id;
    ELSE
        -- Jogador sem usuário vinculado - apenas deletar referências do jogador
        
        -- 1. Deletar presenças
        DELETE FROM presencas WHERE jogador_id = _player_id;
        
        -- 2. Deletar estatísticas
        DELETE FROM estatisticas_partida WHERE jogador_id = _player_id;
        
        -- 3. Deletar conquistas
        DELETE FROM player_achievements WHERE jogador_id = _player_id;
        
        -- 4. Deletar confirmações de presença
        DELETE FROM confirmacoes_presenca WHERE jogador_id = _player_id;
        
        -- 5. Deletar votos
        DELETE FROM votos_destaque WHERE jogador_id = _player_id;
        DELETE FROM votacao_craque WHERE jogador_id = _player_id;
    END IF;
    
    -- Finalmente, deletar o jogador
    DELETE FROM jogadores WHERE id = _player_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION delete_player_permanent(UUID) TO authenticated;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION delete_player_permanent(UUID) IS 
'Deleta um jogador permanentemente, incluindo todas as referências (chat_leituras, estatísticas, conquistas, etc).
Apenas admins do mesmo time ou super_admin podem executar.';
