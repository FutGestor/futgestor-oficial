
CREATE POLICY "Public can view jogos by team"
ON public.jogos FOR SELECT TO anon
USING (true);

CREATE POLICY "Public can view resultados by team"
ON public.resultados FOR SELECT TO anon
USING (true);
