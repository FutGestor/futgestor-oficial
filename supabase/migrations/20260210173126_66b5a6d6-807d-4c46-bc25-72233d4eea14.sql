
-- Fix: Super admin UPDATE policy on chamados
DROP POLICY IF EXISTS "Super admin atualiza chamados" ON public.chamados;
CREATE POLICY "Super admin atualiza chamados"
  ON public.chamados FOR UPDATE
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Fix: User UPDATE policy on chamados
DROP POLICY IF EXISTS "Usuário pode atualizar seus chamados" ON public.chamados;
CREATE POLICY "Usuário pode atualizar seus chamados"
  ON public.chamados FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
