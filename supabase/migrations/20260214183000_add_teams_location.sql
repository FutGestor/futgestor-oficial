-- Adicionar colunas de cidade e estado na tabela teams para busca regional
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS estado TEXT;

-- Criar índices para busca rápida por localização
CREATE INDEX IF NOT EXISTS idx_teams_cidade ON public.teams(cidade);
CREATE INDEX IF NOT EXISTS idx_teams_estado ON public.teams(estado);
