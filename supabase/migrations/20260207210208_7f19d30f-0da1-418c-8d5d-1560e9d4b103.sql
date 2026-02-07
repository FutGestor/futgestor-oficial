
-- Create player financial table for individual player debts/payments
CREATE TABLE public.player_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jogador_id UUID NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo public.transaction_type NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  pago BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_financeiro ENABLE ROW LEVEL SECURITY;

-- Players can view their own financial records
CREATE POLICY "Players can view own financeiro"
ON public.player_financeiro FOR SELECT
USING (
  jogador_id IN (SELECT profiles.jogador_id FROM profiles WHERE profiles.id = auth.uid())
  OR is_team_admin(auth.uid(), team_id)
);

-- Team admins can fully manage player financeiro
CREATE POLICY "Team admins can manage player_financeiro"
ON public.player_financeiro FOR ALL
USING (is_team_admin(auth.uid(), team_id));

-- Trigger for updated_at
CREATE TRIGGER update_player_financeiro_updated_at
BEFORE UPDATE ON public.player_financeiro
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
