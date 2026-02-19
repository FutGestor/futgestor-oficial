-- CORREÇÃO: Verificar contagem ANTES, deletar time DEPOIS de deletar perfil

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
    _should_delete_team BOOLEAN := false;
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
    
    -- Verificar se este é o ÚNICO membro do time (deletar perfil + time)
    -- Se tem 0 ou 1 membros (só este usuário), marcar para deletar o time
    IF _team_id IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM profiles WHERE team_id = _team_id) <= 1 THEN
            _should_delete_team := true;
        END IF;
    END IF;

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
    
    -- 4. Deletar conquistas do jogador
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
    
    -- 10. Deletar perfil (AGORA O TIME FICA SEM MEMBROS)
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 11. SE MARCADO, DELETAR O TIME COMPLETAMENTE
    IF _should_delete_team AND _team_id IS NOT NULL THEN
        -- Deletar todos os dados do time
        DELETE FROM jogos WHERE team_id = _team_id;
        DELETE FROM resultados WHERE jogo_id IN (SELECT id FROM jogos WHERE team_id = _team_id);
        DELETE FROM campeonatos WHERE team_id = _team_id;
        DELETE FROM campeonato_jogos WHERE campeonato_id IN (SELECT id FROM campeonatos WHERE team_id = _team_id);
        DELETE FROM campeonato_classificacao WHERE campeonato_id IN (SELECT id FROM campeonatos WHERE team_id = _team_id);
        DELETE FROM avisos WHERE team_id = _team_id;
        DELETE FROM solicitacoes_jogo WHERE team_id = _team_id OR time_solicitado_id = _team_id;
        DELETE FROM conquistas WHERE team_id = _team_id;
        DELETE FROM transactions WHERE team_id = _team_id;
        DELETE FROM team_config WHERE team_id = _team_id;
        DELETE FROM public_matchmaking WHERE team_id = _team_id;
        DELETE FROM link_convite WHERE team_id = _team_id;
        
        -- Finalmente deletar o time
        DELETE FROM teams WHERE id = _team_id;
    END IF;
    
    -- 12. Deletar usuário
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION admin_delete_user(UUID) IS 'Deleta usuário e seu time (se for o único membro). Apenas God Admin.';
