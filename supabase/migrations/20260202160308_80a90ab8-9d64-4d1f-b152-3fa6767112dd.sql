-- Criar tabela de votos para destaque da partida
CREATE TABLE public.votos_destaque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resultado_id uuid NOT NULL REFERENCES public.resultados(id) ON DELETE CASCADE,
  votante_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogador_id uuid NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(resultado_id, votante_id)
);

-- Habilitar RLS
ALTER TABLE public.votos_destaque ENABLE ROW LEVEL SECURITY;

-- Policies
-- Todos podem ver votos
CREATE POLICY "Anyone can view votos"
ON public.votos_destaque FOR SELECT
USING (true);

-- Usuarios aprovados podem votar
CREATE POLICY "Approved users can vote"
ON public.votos_destaque FOR INSERT
WITH CHECK (
  auth.uid() = votante_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND aprovado = true
  )
);

-- Usuarios podem atualizar seu proprio voto
CREATE POLICY "Users can update own vote"
ON public.votos_destaque FOR UPDATE
USING (auth.uid() = votante_id);

-- Admins podem deletar votos
CREATE POLICY "Admins can delete votos"
ON public.votos_destaque FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_votos_destaque_updated_at
  BEFORE UPDATE ON public.votos_destaque
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();