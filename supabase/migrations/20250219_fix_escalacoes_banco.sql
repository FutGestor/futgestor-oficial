-- Migration: Adicionar coluna 'banco' na tabela escalacoes
-- Data: 2026-02-19

-- Adicionar coluna banco (JSONB para armazenar array de jogadores no banco)
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS banco JSONB DEFAULT '[]'::jsonb;

-- Comentário
COMMENT ON COLUMN escalacoes.banco IS 'Array de jogadores no banco de reservas';

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'escalacoes' AND column_name = 'banco';
