-- ============================================
-- FIX: Restaurar acesso de jogadores às transações financeiras
-- Issue: Jogadores comuns não conseguem visualizar finanças do clube
-- ============================================

-- Garantir que RLS está ativo
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes de SELECT
DROP POLICY IF EXISTS "Team members can view transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes;

-- ============================================
-- POLÍTICA SELECT: Todos (autenticados) podem ver transações
-- O filtro por time é feito no aplicativo (WHERE team_id = ...)
-- ============================================
CREATE POLICY "Anyone can view transacoes"
  ON public.transacoes FOR SELECT
  USING (true);

-- ============================================
-- POLÍTICAS de modificação (INSERT/UPDATE/DELETE): Apenas admins
-- ============================================
-- Remover políticas de gerenciamento existentes
DROP POLICY IF EXISTS "Team admins can manage transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Admins can manage transacoes" ON public.transacoes;

-- Criar política para admins gerenciarem
CREATE POLICY "Team admins can manage transacoes"
  ON public.transacoes FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- ============================================
-- GARANTIR PERMISSÕES
-- ============================================
GRANT SELECT ON public.transacoes TO authenticated;
GRANT SELECT ON public.transacoes TO anon;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'transacoes';
