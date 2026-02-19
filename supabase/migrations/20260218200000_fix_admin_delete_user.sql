-- Função para deletar usuário completamente (God Admin apenas)
-- Esta função deleta o usuário do auth.users e todos os dados relacionados

CREATE OR REPLACE FUNCTION admin_delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _jogador_ids UUID[];
    _team_id UUID;
    _caller_email TEXT;
    _target_email TEXT;
BEGIN
    -- Pegar email de quem está chamando
    SELECT email INTO _caller_email FROM auth.users WHERE id = auth.uid();
    
    -- Pegar email do usuário alvo
    SELECT email INTO _target_email FROM auth.users WHERE id = _user_id;
    
    -- Verificar se quem está chamando é o God Admin
    IF _caller_email IS NULL OR _caller_email != 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'Apenas God Admin pode executar esta função. Email caller: %', _caller_email;
    END IF;
    
    -- Proteção: não permitir deletar o próprio God Admin
    IF _target_email = 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'Não é permitido deletar a conta God Admin (futgestor@gmail.com)';
    END IF;

    -- Pegar IDs dos jogadores deste usuário
    SELECT ARRAY_AGG(id) INTO _jogador_ids FROM jogadores WHERE user_id = _user_id;

    -- 1. Deletar presenças primeiro (tabela filha de jogadores)
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM presencas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 2. Deletar estatísticas de jogador
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM jogador_estatisticas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 3. Deletar mensagens de chamados deste usuário
    DELETE FROM chamado_mensagens WHERE user_id = _user_id;
    
    -- 4. Deletar mensagens de chamados onde o usuário é o dono do chamado
    DELETE FROM chamado_mensagens WHERE chamado_id IN (
        SELECT id FROM chamados WHERE user_id = _user_id
    );
    
    -- 5. Deletar anexos de chamados onde o usuário é o dono
    DELETE FROM chamado_anexos WHERE chamado_id IN (
        SELECT id FROM chamados WHERE user_id = _user_id
    );
    
    -- 6. Deletar chamados
    DELETE FROM chamados WHERE user_id = _user_id;
    
    -- 7. Deletar leituras de avisos
    DELETE FROM aviso_leituras WHERE user_id = _user_id;
    
    -- 8. Deletar roles do usuário
    DELETE FROM user_roles WHERE user_id = _user_id;
    
    -- 9. Deletar jogadores
    DELETE FROM jogadores WHERE user_id = _user_id;
    
    -- 10. Deletar notificações (se existir)
    DELETE FROM notificacoes WHERE user_id = _user_id;
    
    -- 11. Deletar conquistas do jogador
    DELETE FROM conquistas_jogadores WHERE jogador_id IN (
        SELECT id FROM jogadores WHERE user_id = _user_id
    );
    
    -- 12. Deletar perfil
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 13. FINALMENTE deletar o usuário do auth
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

-- Dar permissão para authenticated users chamarem a função
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Comentário da função
COMMENT ON FUNCTION admin_delete_user(UUID) IS 'Deleta um usuário completamente incluindo todos os dados relacionados. Apenas God Admin (futgestor@gmail.com) pode executar.';

-- Dar permissão para authenticated users chamarem a função
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Comentário da função
COMMENT ON FUNCTION admin_delete_user(UUID) IS 'Deleta um usuário completamente incluindo todos os dados relacionados. Apenas God Admin (futgestor@gmail.com) pode executar.';
