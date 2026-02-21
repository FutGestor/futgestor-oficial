-- ============================================
-- DEBUG: Verificar configuração do convite
-- ============================================

-- 1. Verificar se a coluna invite_code existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teams' AND column_name = 'invite_code';

-- 2. Verificar policies da tabela teams
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teams';

-- 3. Verificar se RLS está ativado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'teams';

-- 4. Verificar times com invite_code
SELECT id, nome, slug, invite_code 
FROM teams 
WHERE invite_code IS NOT NULL 
LIMIT 5;

-- 5. Testar se a policy funciona (simulando usuário anônimo)
-- Executar como usuário anon:
-- SET ROLE anon;
-- SELECT * FROM teams WHERE invite_code = 'S2RF5U';
-- RESET ROLE;

-- ============================================
-- FIX: Policy mais permissiva para convites
-- ============================================

-- Remover todas as policies de select existentes para teams
DROP POLICY IF EXISTS "Public can view teams by invite code" ON public.teams;
DROP POLICY IF EXISTS "Public can view active teams" ON public.teams;

-- Criar policy única e mais permissiva
CREATE POLICY "Allow public read for active teams and invite lookup"
  ON public.teams FOR SELECT
  TO PUBLIC
  USING (ativo = true OR invite_code IS NOT NULL);

-- Verificar se deu certo
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teams';
