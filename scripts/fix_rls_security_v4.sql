-- =====================================================
-- CORREÇÃO CRÍTICA: Políticas RLS Inseguras (V4)
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/uwymdqweysrgdxbjwpzr/sql/new
-- =====================================================

-- =====================================================
-- 1. TABELA: ml_escalacao_padroes
-- =====================================================

-- Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ml_escalacao_padroes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON ml_escalacao_padroes', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas membros do time ou super_admin
CREATE POLICY "team_members_view_ml_patterns"
ON ml_escalacao_padroes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.team_id = ml_escalacao_padroes.team_id
    )
    OR is_super_admin(auth.uid())
);

-- INSERT: Apenas admins do time ou super_admin
CREATE POLICY "team_admins_insert_ml_patterns"
ON ml_escalacao_padroes
FOR INSERT
TO authenticated
WITH CHECK (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- UPDATE: Apenas admins do time ou super_admin
CREATE POLICY "team_admins_update_ml_patterns"
ON ml_escalacao_padroes
FOR UPDATE
TO authenticated
USING (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- DELETE: Apenas admins do time ou super_admin
CREATE POLICY "team_admins_delete_ml_patterns"
ON ml_escalacao_padroes
FOR DELETE
TO authenticated
USING (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- =====================================================
-- 2. TABELA: ml_jogador_posicoes
-- =====================================================

-- Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ml_jogador_posicoes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON ml_jogador_posicoes', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE ml_jogador_posicoes ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuários podem ver apenas dados de jogadores do seu time
CREATE POLICY "team_members_view_ml_positions"
ON ml_jogador_posicoes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jogadores j
        JOIN profiles p ON p.team_id = j.team_id
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND p.id = auth.uid()
    )
    OR is_super_admin(auth.uid())
);

-- INSERT: Apenas admins do time do jogador ou super_admin
CREATE POLICY "team_admins_insert_ml_positions"
ON ml_jogador_posicoes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jogadores j
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- UPDATE: Apenas admins do time do jogador ou super_admin
CREATE POLICY "team_admins_update_ml_positions"
ON ml_jogador_posicoes
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jogadores j
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jogadores j
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- DELETE: Apenas admins do time do jogador ou super_admin
CREATE POLICY "team_admins_delete_ml_positions"
ON ml_jogador_posicoes
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jogadores j
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- =====================================================
-- 3. TABELA: notificacoes
-- =====================================================

-- Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notificacoes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notificacoes', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: Próprias notificações OU do time (se admin)
CREATE POLICY "users_view_notifications"
ON notificacoes
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- INSERT: Apenas admins do time ou super_admin podem criar notificações
CREATE POLICY "admins_insert_notifications"
ON notificacoes
FOR INSERT
TO authenticated
WITH CHECK (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- UPDATE: Usuários podem marcar como lida apenas suas próprias notificações
CREATE POLICY "users_update_notifications"
ON notificacoes
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- DELETE: Apenas super_admin ou o próprio usuário
CREATE POLICY "users_delete_notifications"
ON notificacoes
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR is_super_admin(auth.uid())
);

-- =====================================================
-- 4. TABELA: presencas
-- =====================================================
-- NOTA: A tabela presenca_links tem: id, jogo_id, team_id, codigo, created_at
-- NÃO tem colunas 'ativo' ou 'expira_em'

-- Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'presencas'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON presencas', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins do time podem ver presenças do time
CREATE POLICY "admins_view_presencas"
ON presencas
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        JOIN profiles p ON p.team_id = pl.team_id
        WHERE pl.id = presencas.presenca_link_id
        AND p.id = auth.uid()
        AND (is_team_admin(auth.uid(), pl.team_id) OR is_super_admin(auth.uid()))
    )
);

-- INSERT: Qualquer um pode inserir com link válido (verifica se o link existe)
CREATE POLICY "public_insert_presencas"
ON presencas
FOR INSERT
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        WHERE pl.id = presencas.presenca_link_id
    )
);

-- UPDATE: Apenas admins do time podem atualizar
CREATE POLICY "admins_update_presencas"
ON presencas
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        JOIN profiles p ON p.team_id = pl.team_id
        WHERE pl.id = presencas.presenca_link_id
        AND p.id = auth.uid()
        AND (is_team_admin(auth.uid(), pl.team_id) OR is_super_admin(auth.uid()))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        JOIN profiles p ON p.team_id = pl.team_id
        WHERE pl.id = presencas.presenca_link_id
        AND p.id = auth.uid()
        AND (is_team_admin(auth.uid(), pl.team_id) OR is_super_admin(auth.uid()))
    )
);

-- DELETE: Apenas admins do time ou super_admin
CREATE POLICY "admins_delete_presencas"
ON presencas
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        JOIN profiles p ON p.team_id = pl.team_id
        WHERE pl.id = presencas.presenca_link_id
        AND p.id = auth.uid()
        AND (is_team_admin(auth.uid(), pl.team_id) OR is_super_admin(auth.uid()))
    )
);

-- =====================================================
-- VERIFICAÇÃO: Listar políticas criadas
-- =====================================================
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('ml_escalacao_padroes', 'ml_jogador_posicoes', 'notificacoes', 'presencas')
ORDER BY tablename, policyname;
