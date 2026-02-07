CREATE POLICY "Public can view teams by slug"
ON public.teams FOR SELECT TO anon
USING (true);