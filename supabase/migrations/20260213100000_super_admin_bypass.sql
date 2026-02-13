-- Migração REVOLUCIONÁRIA e RESILIENTE para Super Admin Bypass
-- Usa DROP/CREATE para evitar erros de nomes de políticas inexistentes

-- 0. Garantir a função is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
$$;

-- 1. Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 2. Jogadores
DROP POLICY IF EXISTS "Team members can view jogadores" ON public.jogadores;
DROP POLICY IF EXISTS "Anyone can view jogadores" ON public.jogadores;
CREATE POLICY "Team members can view jogadores" ON public.jogadores 
FOR SELECT USING (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage jogadores" ON public.jogadores;
DROP POLICY IF EXISTS "Admins can manage jogadores" ON public.jogadores;
CREATE POLICY "Team admins can manage jogadores" ON public.jogadores 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 3. Jogos
DROP POLICY IF EXISTS "Team members can view jogos" ON public.jogos;
DROP POLICY IF EXISTS "Anyone can view jogos" ON public.jogos;
CREATE POLICY "Team members can view jogos" ON public.jogos 
FOR SELECT USING (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage jogos" ON public.jogos;
DROP POLICY IF EXISTS "Admins can manage jogos" ON public.jogos;
CREATE POLICY "Team admins can manage jogos" ON public.jogos 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 4. Escalações
DROP POLICY IF EXISTS "Team members can view published escalacoes" ON public.escalacoes;
DROP POLICY IF EXISTS "Anyone can view published escalacoes" ON public.escalacoes;
CREATE POLICY "Team members can view published escalacoes" ON public.escalacoes 
FOR SELECT USING (
  (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin())
  AND (publicada = true OR public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin())
);

DROP POLICY IF EXISTS "Team admins can manage escalacoes" ON public.escalacoes;
DROP POLICY IF EXISTS "Admins can manage escalacoes" ON public.escalacoes;
CREATE POLICY "Team admins can manage escalacoes" ON public.escalacoes 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 5. Transações
DROP POLICY IF EXISTS "Team members can view transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes;
CREATE POLICY "Team members can view transacoes" ON public.transacoes 
FOR SELECT USING (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Admins can manage transacoes" ON public.transacoes;
CREATE POLICY "Team admins can manage transacoes" ON public.transacoes 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 6. Resultados
DROP POLICY IF EXISTS "Team members can view resultados" ON public.resultados;
DROP POLICY IF EXISTS "Anyone can view resultados" ON public.resultados;
CREATE POLICY "Team members can view resultados" ON public.resultados 
FOR SELECT USING (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage resultados" ON public.resultados;
DROP POLICY IF EXISTS "Admins can manage resultados" ON public.resultados;
CREATE POLICY "Team admins can manage resultados" ON public.resultados 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());

-- 7. Estatísticas
DROP POLICY IF EXISTS "Team members can view estatisticas" ON public.estatisticas_partida;
DROP POLICY IF EXISTS "Anyone can view estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team members can view estatisticas" ON public.estatisticas_partida 
FOR SELECT USING (team_id = public.get_user_team_id() OR team_id IS NULL OR public.is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage estatisticas" ON public.estatisticas_partida;
DROP POLICY IF EXISTS "Admins can manage estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team admins can manage estatisticas" ON public.estatisticas_partida 
FOR ALL USING (public.is_team_admin(auth.uid(), team_id) OR public.is_super_admin());
