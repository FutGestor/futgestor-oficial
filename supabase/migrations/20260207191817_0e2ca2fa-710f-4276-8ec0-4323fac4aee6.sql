-- Add public read policies for escalacoes (so visitors can see lineups)
CREATE POLICY "Public can view published escalacoes"
ON public.escalacoes FOR SELECT TO anon, authenticated
USING (publicada = true);

-- Add public read policies for escalacao_jogadores
CREATE POLICY "Public can view published escalacao jogadores"
ON public.escalacao_jogadores FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM escalacoes e
  WHERE e.id = escalacao_jogadores.escalacao_id
  AND e.publicada = true
));

-- Add public read policies for estatisticas_partida (for ranking)
CREATE POLICY "Public can view estatisticas"
ON public.estatisticas_partida FOR SELECT TO anon, authenticated
USING (true);

-- Add public read policy for jogadores (needed for ranking/escalacao display)
CREATE POLICY "Public can view jogadores by team"
ON public.jogadores FOR SELECT TO anon, authenticated
USING (true);