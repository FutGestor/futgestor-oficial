-- ============================================
-- CORREÇÃO: delete_own_account deve deletar o time se for o único membro
-- ============================================

DROP FUNCTION IF EXISTS public.delete_own_account();

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _user_id UUID;
    _jogador_ids UUID[];
    _team_id UUID;
    _team_member_count INTEGER;
    _user_email TEXT;
BEGIN
    _user_id := auth.uid();
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario nao autenticado';
    END IF;
    
    SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
    IF _user_email = 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'God Admin nao pode se auto-excluir';
    END IF;
    
    -- Pegar team_id do usuário
    SELECT team_id INTO _team_id FROM profiles WHERE id = _user_id;
    
    -- Contar quantos usuários ainda têm este team_id
    SELECT COUNT(*) INTO _team_member_count FROM profiles WHERE team_id = _team_id;
    
    -- Pegar IDs dos jogadores do usuário
    SELECT ARRAY_AGG(id) INTO _jogador_ids FROM jogadores WHERE user_id = _user_id;

    -- 1. Deletar chat_leituras
    DELETE FROM chat_leituras WHERE user_id = _user_id;
    
    -- 2. Deletar presencas
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM presencas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 3. Deletar conquistas do jogador
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM player_achievements WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 4. Deletar mensagens de chamados
    DELETE FROM chamado_mensagens WHERE user_id = _user_id;
    DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamados WHERE user_id = _user_id;
    
    -- 5. Deletar leituras de avisos
    DELETE FROM aviso_leituras WHERE user_id = _user_id;
    
    -- 6. Deletar roles
    DELETE FROM user_roles WHERE user_id = _user_id;
    
    -- 7. Deletar jogadores
    DELETE FROM jogadores WHERE user_id = _user_id;
    
    -- 8. Deletar notificações
    DELETE FROM notificacoes WHERE user_id = _user_id;
    
    -- 9. Deletar perfil
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 10. SE O TIME SÓ TINHA ESTE USUÁRIO, DELETAR O TIME COMPLETAMENTE
    IF _team_id IS NOT NULL AND _team_member_count <= 1 THEN
        -- Deletar todos os dados do time (mesma lógica do delete_own_team)
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
        DELETE FROM teams WHERE id = _team_id;
    END IF;
    
    -- 11. Deletar usuário do auth
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

COMMENT ON FUNCTION public.delete_own_account() IS 
'Permite que qualquer usuário (exceto God Admin) exclua sua própria conta permanentemente. Se for o único membro do time, o time também é deletado.';
