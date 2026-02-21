-- ============================================
-- CORREÇÃO: Permitir que todos (exceto God) se auto-excluam
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
    _user_email TEXT;
BEGIN
    -- Pegar ID do usuário logado
    _user_id := auth.uid();
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se é God Admin (único que não pode se auto-excluir)
    SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
    IF _user_email = 'futgestor@gmail.com' THEN
        RAISE EXCEPTION 'God Admin não pode se auto-excluir';
    END IF;
    
    -- REMOVIDO: Verificação de admin - agora todos podem se auto-excluir
    
    -- Pegar team_id do usuário
    SELECT team_id INTO _team_id FROM profiles WHERE id = _user_id;
    
    -- Pegar IDs dos jogadores do usuário
    SELECT ARRAY_AGG(id) INTO _jogador_ids FROM jogadores WHERE user_id = _user_id;

    -- 1. Deletar chat_leituras
    DELETE FROM chat_leituras WHERE user_id = _user_id;
    
    -- 2. Deletar presenças
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
    
    -- 6. Deletar roles (incluindo role de admin se existir)
    DELETE FROM user_roles WHERE user_id = _user_id;
    
    -- 7. Deletar jogadores
    DELETE FROM jogadores WHERE user_id = _user_id;
    
    -- 8. Deletar notificações
    DELETE FROM notificacoes WHERE user_id = _user_id;
    
    -- 9. Deletar perfil
    DELETE FROM profiles WHERE id = _user_id;
    
    -- 10. Deletar usuário do auth
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

COMMENT ON FUNCTION public.delete_own_account() IS 
'Permite que qualquer usuário (exceto God Admin) exclua sua própria conta permanentemente.';

-- ============================================
-- Atualizar também o componente React para mostrar para todos (exceto God)
-- ============================================
-- Nota: O componente PlayerSelfDelete.tsx já verifica isGodAdmin, então está correto.
-- Apenas a função RPC precisava ser atualizada.
