-- ============================================
-- FIX: Políticas RLS para confirmacoes_presenca - Versão Jogador
-- Issue: Jogadores (não admins) não conseguem confirmar presença
-- ============================================

-- Garantir que RLS está ativo
ALTER TABLE public.confirmacoes_presenca ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Team members can view confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Approved users can insert own confirmacao" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Users can update own confirmacao or admin" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Team admins can delete confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can view confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can insert their own confirmacao" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can update confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Admins can delete confirmacoes" ON public.confirmacoes_presenca;

-- ============================================
-- POLÍTICA SELECT: Qualquer um pode ver (já que team_id filtra no app)
-- ============================================
CREATE POLICY "Anyone can view confirmacoes"
  ON public.confirmacoes_presenca FOR SELECT
  USING (true);

-- ============================================
-- POLÍTICA INSERT: 
-- - Admin pode inserir qualquer confirmação
-- - Jogador pode inserir apenas sua própria confirmação (vinculada ao profile)
-- ============================================
CREATE POLICY "Users can insert own confirmacao or admin"
  ON public.confirmacoes_presenca FOR INSERT
  WITH CHECK (
    -- Admin pode inserir qualquer confirmação
    public.is_team_admin(auth.uid(), team_id)
    OR
    -- Jogador pode inserir apenas sua própria confirmação
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

-- ============================================
-- POLÍTICA UPDATE:
-- - Admin pode atualizar qualquer confirmação
-- - Jogador pode atualizar apenas sua própria confirmação
-- ============================================
CREATE POLICY "Users can update own confirmacao or admin"
  ON public.confirmacoes_presenca FOR UPDATE
  USING (
    -- Admin pode atualizar qualquer confirmação
    public.is_team_admin(auth.uid(), team_id)
    OR
    -- Jogador pode atualizar apenas sua própria confirmação
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

-- ============================================
-- POLÍTICA DELETE: Apenas admins
-- ============================================
CREATE POLICY "Team admins can delete confirmacoes"
  ON public.confirmacoes_presenca FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

-- ============================================
-- GARANTIR PERMISSÕES
-- ============================================
GRANT ALL ON public.confirmacoes_presenca TO authenticated;
GRANT ALL ON public.confirmacoes_presenca TO anon;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'confirmacoes_presenca';
