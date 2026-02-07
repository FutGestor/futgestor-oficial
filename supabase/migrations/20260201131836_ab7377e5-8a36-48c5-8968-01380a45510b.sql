-- Enum para status de presença
CREATE TYPE public.presence_status AS ENUM ('confirmado', 'indisponivel', 'pendente');

-- Tabela de estatísticas por partida
CREATE TABLE public.estatisticas_partida (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resultado_id UUID NOT NULL REFERENCES public.resultados(id) ON DELETE CASCADE,
  jogador_id UUID NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  gols INTEGER NOT NULL DEFAULT 0,
  assistencias INTEGER NOT NULL DEFAULT 0,
  cartao_amarelo BOOLEAN NOT NULL DEFAULT false,
  cartao_vermelho BOOLEAN NOT NULL DEFAULT false,
  participou BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resultado_id, jogador_id)
);

-- Tabela de confirmações de presença
CREATE TABLE public.confirmacoes_presenca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jogo_id UUID NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  jogador_id UUID NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  status public.presence_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(jogo_id, jogador_id)
);

-- Adicionar coluna temporada na tabela jogos
ALTER TABLE public.jogos ADD COLUMN temporada TEXT DEFAULT '2025';

-- Enable RLS
ALTER TABLE public.estatisticas_partida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmacoes_presenca ENABLE ROW LEVEL SECURITY;

-- RLS Policies para estatisticas_partida
CREATE POLICY "Anyone can view estatisticas"
  ON public.estatisticas_partida
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage estatisticas"
  ON public.estatisticas_partida
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para confirmacoes_presenca
CREATE POLICY "Anyone can view confirmacoes"
  ON public.confirmacoes_presenca
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert their own confirmacao"
  ON public.confirmacoes_presenca
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update confirmacoes"
  ON public.confirmacoes_presenca
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete confirmacoes"
  ON public.confirmacoes_presenca
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_confirmacoes_presenca_updated_at
  BEFORE UPDATE ON public.confirmacoes_presenca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();