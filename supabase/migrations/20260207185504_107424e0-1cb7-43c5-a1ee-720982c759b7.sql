
-- Tabela presenca_links
CREATE TABLE public.presenca_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id),
  codigo text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(jogo_id)
);
ALTER TABLE public.presenca_links ENABLE ROW LEVEL SECURITY;

-- Tabela presencas
CREATE TABLE public.presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presenca_link_id uuid NOT NULL REFERENCES public.presenca_links(id) ON DELETE CASCADE,
  jogador_id uuid NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('confirmado', 'ausente')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(presenca_link_id, jogador_id)
);
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- RLS: presenca_links
CREATE POLICY "Public can read presenca_links by codigo"
ON public.presenca_links FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Team admins can manage presenca_links"
ON public.presenca_links FOR ALL TO authenticated
USING (is_team_admin(auth.uid(), team_id));

-- RLS: presencas
CREATE POLICY "Public can read presencas"
ON public.presencas FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert presencas"
ON public.presencas FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update presencas"
ON public.presencas FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Team admins can delete presencas"
ON public.presencas FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM presenca_links pl
  WHERE pl.id = presencas.presenca_link_id
  AND is_team_admin(auth.uid(), pl.team_id)
));
