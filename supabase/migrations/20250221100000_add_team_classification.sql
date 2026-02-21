-- ============================================
-- CORREÇÃO: Adicionar campos de classificação à tabela teams
-- ============================================

-- Adicionar colunas de classificação se não existirem
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS modalidade TEXT,
ADD COLUMN IF NOT EXISTS faixa_etaria TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT;

-- Criar índices para performance nas buscas
CREATE INDEX IF NOT EXISTS idx_teams_modalidade ON public.teams(modalidade);
CREATE INDEX IF NOT EXISTS idx_teams_faixa_etaria ON public.teams(faixa_etaria);
CREATE INDEX IF NOT EXISTS idx_teams_genero ON public.teams(genero);

-- Migrar dados existentes da tabela times para teams
-- (apenas onde is_casa = true, ou seja, o time principal)
UPDATE public.teams t
SET 
  modalidade = tm.modalidade,
  faixa_etaria = tm.faixa_etaria,
  genero = tm.genero
FROM public.times tm
WHERE t.id = tm.team_id 
  AND tm.is_casa = true
  AND (t.modalidade IS NULL OR t.faixa_etaria IS NULL OR t.genero IS NULL);

-- Verificar migração
SELECT 
  t.nome,
  t.modalidade,
  t.faixa_etaria,
  t.genero
FROM public.teams t
WHERE t.modalidade IS NOT NULL
LIMIT 5;
