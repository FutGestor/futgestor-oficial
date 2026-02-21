-- ============================================
-- FIX: Restaurar políticas RLS para confirmacoes_presenca
-- Issue: Usuários não conseguem confirmar presença (403 Forbidden)
-- ============================================

-- Garantir que RLS está ativo
ALTER TABLE public.confirmacoes_presenca ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Team members can view confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Approved users can insert own confirmacao" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Users can update own confirmacao or admin" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Team admins can delete confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can view confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can insert their own confirmacao" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can update confirmacoes" ON public.confirmacoes_presenca;
DROP POLICY IF EXISTS "Admins can delete confirmacoes" ON public.confirmacoes_presenca;

-- Política SELECT: Membros do time podem ver confirmações
CREATE POLICY "Team members can view confirmacoes"
  ON public.confirmacoes_presenca FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

-- Política INSERT: Usuários aprovados podem inserir sua própria confirmação OU admins
CREATE POLICY "Approved users can insert own confirmacao"
  ON public.confirmacoes_presenca FOR INSERT
  WITH CHECK (
    public.is_team_admin(auth.uid(), team_id)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.aprovado = true
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

-- Política UPDATE: Usuários podem atualizar sua própria confirmação OU admins
CREATE POLICY "Users can update own confirmacao or admin"
  ON public.confirmacoes_presenca FOR UPDATE
  USING (
    public.is_team_admin(auth.uid(), team_id)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

-- Política DELETE: Apenas admins podem deletar
CREATE POLICY "Team admins can delete confirmacoes"
  ON public.confirmacoes_presenca FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

-- Garantir permissões na tabela
GRANT ALL ON public.confirmacoes_presenca TO authenticated;
GRANT ALL ON public.confirmacoes_presenca TO anon;

-- ============================================
-- VERIFICAÇÃO: Listar políticas ativas
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'confirmacoes_presenca';
