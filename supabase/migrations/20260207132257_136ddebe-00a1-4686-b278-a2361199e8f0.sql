
-- Fix multi-tenant RLS: Remove "OR (team_id IS NULL)" from all SELECT policies
-- This prevents data leakage between teams and to anonymous users

-- jogadores
DROP POLICY IF EXISTS "Team members can view jogadores" ON public.jogadores;
CREATE POLICY "Team members can view jogadores" ON public.jogadores
FOR SELECT USING (team_id = get_user_team_id());

-- jogos
DROP POLICY IF EXISTS "Team members can view jogos" ON public.jogos;
CREATE POLICY "Team members can view jogos" ON public.jogos
FOR SELECT USING (team_id = get_user_team_id());

-- confirmacoes_presenca
DROP POLICY IF EXISTS "Team members can view confirmacoes" ON public.confirmacoes_presenca;
CREATE POLICY "Team members can view confirmacoes" ON public.confirmacoes_presenca
FOR SELECT USING (team_id = get_user_team_id());

-- escalacoes
DROP POLICY IF EXISTS "Team members can view published escalacoes" ON public.escalacoes;
CREATE POLICY "Team members can view published escalacoes" ON public.escalacoes
FOR SELECT USING (team_id = get_user_team_id() AND (publicada = true OR is_team_admin(auth.uid(), team_id)));

-- escalacao_jogadores (depends on escalacoes join)
DROP POLICY IF EXISTS "Team members can view escalacao_jogadores" ON public.escalacao_jogadores;
CREATE POLICY "Team members can view escalacao_jogadores" ON public.escalacao_jogadores
FOR SELECT USING (EXISTS (
  SELECT 1 FROM escalacoes e
  WHERE e.id = escalacao_jogadores.escalacao_id
    AND e.team_id = get_user_team_id()
    AND (e.publicada = true OR is_team_admin(auth.uid(), e.team_id))
));

-- estatisticas_partida
DROP POLICY IF EXISTS "Team members can view estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team members can view estatisticas" ON public.estatisticas_partida
FOR SELECT USING (team_id = get_user_team_id());

-- resultados
DROP POLICY IF EXISTS "Team members can view resultados" ON public.resultados;
CREATE POLICY "Team members can view resultados" ON public.resultados
FOR SELECT USING (team_id = get_user_team_id());

-- transacoes
DROP POLICY IF EXISTS "Team members can view transacoes" ON public.transacoes;
CREATE POLICY "Team members can view transacoes" ON public.transacoes
FOR SELECT USING (team_id = get_user_team_id());

-- times
DROP POLICY IF EXISTS "Team members can view times" ON public.times;
CREATE POLICY "Team members can view times" ON public.times
FOR SELECT USING (team_id = get_user_team_id());

-- votos_destaque
DROP POLICY IF EXISTS "Team members can view votos" ON public.votos_destaque;
CREATE POLICY "Team members can view votos" ON public.votos_destaque
FOR SELECT USING (team_id = get_user_team_id());

-- avisos
DROP POLICY IF EXISTS "Team members can view published avisos" ON public.avisos;
CREATE POLICY "Team members can view published avisos" ON public.avisos
FOR SELECT USING (team_id = get_user_team_id() AND (publicado = true OR is_team_admin(auth.uid(), team_id)));
