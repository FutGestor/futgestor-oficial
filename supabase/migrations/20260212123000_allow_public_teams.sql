-- Allow public read access to teams (needed for public team pages)
CREATE POLICY "Public can view teams"
  ON public.teams FOR SELECT
  USING (true);
