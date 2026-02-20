-- =====================================================
-- CORREÇÃO CRÍTICA: Políticas RLS Inseguras (V2)
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/uwymdqweysrgdxbjwpzr/sql/new
-- =====================================================

-- =====================================================
-- 1. TABELA: ml_escalacao_padroes
-- =====================================================

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Allow authenticated insert" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow authenticated select" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow authenticated update" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow authenticated delete" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow public read access" ON ml_escalacao_padroes;

-- Habilitar RLS (caso não esteja habilitado)
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ver apenas dados do seu time
CREATE POLICY "Team members can view ML patterns"
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

-- Política INSERT: Apenas admins do time ou super_admin
CREATE POLICY "Team admins can insert ML patterns"
ON ml_escalacao_padroes
FOR INSERT
TO authenticated
WITH CHECK (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- Política UPDATE: Apenas admins do time ou super_admin
CREATE POLICY "Team admins can update ML patterns"
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

-- Política DELETE: Apenas admins do time ou super_admin
CREATE POLICY "Team admins can delete ML patterns"
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
-- NOTA: Esta tabela NÃO tem team_id, ela tem jogador_id
-- que referencia jogadores(team_id)

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Allow authenticated insert" ON ml_jogador_posicoes;
DROP POLICY IF EXISTS "Allow authenticated select" ON ml_jogador_posicoes;
DROP POLICY IF EXISTS "Allow authenticated update" ON ml_jogador_posicoes;
DROP POLICY IF EXISTS "Allow authenticated delete" ON ml_jogador_posicoes;
DROP POLICY IF EXISTS "Allow public read access" ON ml_jogador_posicoes;

-- Habilitar RLS (caso não esteja habilitado)
ALTER TABLE ml_jogador_posicoes ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ver apenas dados de jogadores do seu time
CREATE POLICY "Team members can view ML player positions"
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

-- Política INSERT: Apenas admins do time do jogador ou super_admin
CREATE POLICY "Team admins can insert ML player positions"
ON ml_jogador_posicoes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jogadores j
        JOIN profiles p ON p.team_id = j.team_id
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND p.id = auth.uid()
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- Política UPDATE: Apenas admins do time do jogador ou super_admin
CREATE POLICY "Team admins can update ML player positions"
ON ml_jogador_posicoes
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jogadores j
        JOIN profiles p ON p.team_id = j.team_id
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND p.id = auth.uid()
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jogadores j
        JOIN profiles p ON p.team_id = j.team_id
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND p.id = auth.uid()
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- Política DELETE: Apenas admins do time do jogador ou super_admin
CREATE POLICY "Team admins can delete ML player positions"
ON ml_jogador_posicoes
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jogadores j
        JOIN profiles p ON p.team_id = j.team_id
        WHERE j.id = ml_jogador_posicoes.jogador_id
        AND p.id = auth.uid()
        AND is_team_admin(auth.uid(), j.team_id)
    )
    OR is_super_admin(auth.uid())
);

-- =====================================================
-- 3. TABELA: notificacoes
-- =====================================================

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Enable insert for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Enable select for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Enable update for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;

-- Habilitar RLS (caso não esteja habilitado)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Próprias notificações OU do time (se admin)
CREATE POLICY "Users can view own notifications"
ON notificacoes
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- Política INSERT: Apenas admins do time ou super_admin podem criar notificações
CREATE POLICY "Team admins can insert notifications"
ON notificacoes
FOR INSERT
TO authenticated
WITH CHECK (
    is_team_admin(auth.uid(), team_id)
    OR is_super_admin(auth.uid())
);

-- Política UPDATE: Usuários podem marcar como lida apenas suas próprias notificações
CREATE POLICY "Users can update own notifications"
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

-- Política DELETE: Apenas super_admin ou o próprio usuário (raramente usado)
CREATE POLICY "Users can delete own notifications"
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

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Anyone can insert presencas" ON presencas;
DROP POLICY IF EXISTS "Anyone can update presencas" ON presencas;
DROP POLICY IF EXISTS "Anyone can select presencas" ON presencas;
DROP POLICY IF EXISTS "Anyone can delete presencas" ON presencas;

-- Habilitar RLS (caso não esteja habilitado)
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Admins do time podem ver presenças do time
CREATE POLICY "Team admins can view presencas"
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

-- Política INSERT: Qualquer um pode inserir (link público), mas com validação
CREATE POLICY "Public can insert presencas with valid link"
ON presencas
FOR INSERT
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presenca_links pl
        WHERE pl.id = presencas.presenca_link_id
        AND pl.ativo = true
        AND (pl.expira_em IS NULL OR pl.expira_em > now())
    )
);

-- Política UPDATE: Apenas admins do time podem atualizar
CREATE POLICY "Team admins can update presencas"
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

-- Política DELETE: Apenas admins do time ou super_admin
CREATE POLICY "Team admins can delete presencas"
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
