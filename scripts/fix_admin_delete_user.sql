-- =====================================================
-- CORREÇÃO CRÍTICA: Função admin_delete_user
-- A tabela 'jogador_estatisticas' não existe
-- A tabela correta é 'estatisticas_partida'
-- Execute no SQL Editor do Supabase
-- =====================================================

DROP FUNCTION IF EXISTS admin_delete_user(UUID);

CREATE OR REPLACE FUNCTION admin_delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _jogador_ids UUID[];
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

    SELECT ARRAY_AGG(id) INTO _jogador_ids FROM jogadores WHERE user_id = _user_id;

    -- 1. Deletar chat_leituras
    DELETE FROM chat_leituras WHERE user_id = _user_id;
    
    -- 2. Deletar mensagens de chat
    DELETE FROM chat_mensagens WHERE user_id = _user_id;
    
    -- 3. Deletar presenças
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM presencas WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 4. Deletar estatísticas de jogador (CORRIGIDO: estatisticas_partida)
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM estatisticas_partida WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 5. Deletar conquistas do jogador
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM player_achievements WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 6. Deletar confirmações de presença
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM confirmacoes_presenca WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 7. Deletar votos
    IF _jogador_ids IS NOT NULL THEN
        DELETE FROM votos_destaque WHERE jogador_id = ANY(_jogador_ids);
        DELETE FROM votacao_craque WHERE jogador_id = ANY(_jogador_ids);
    END IF;
    
    -- 8. Deletar mensagens de chamados
    DELETE FROM chamado_mensagens WHERE user_id = _user_id;
    DELETE FROM chamado_mensagens WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamado_anexos WHERE chamado_id IN (SELECT id FROM chamados WHERE user_id = _user_id);
    DELETE FROM chamados WHERE user_id = _user_id;
    
    -- 9. Deletar leituras de avisos
    DELETE FROM aviso_leituras WHERE user_id = _user_id;
    
    -- 10. Deletar roles
    DELETE FROM user_roles WHERE user_id = _user_id;
    
    -- 11. Deletar jogadores
    DELETE FROM jogadores WHERE user_id = _user_id;
    
    -- 12. Deletar notificações
    DELETE FROM notificacoes WHERE user_id = _user_id;
    
    -- 13. Deletar perfil
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 14. Deletar usuário
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Verificar se a função foi criada corretamente
SELECT 
    proname as function_name,
    proowner::regrole as owner,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'admin_delete_user';
