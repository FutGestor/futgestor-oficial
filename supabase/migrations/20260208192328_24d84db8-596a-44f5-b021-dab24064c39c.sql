-- Allow public read access to subscriptions so visitors can see team plan features
CREATE POLICY "Public can view subscription plan"
  ON public.subscriptions
  FOR SELECT
  USING (true);
