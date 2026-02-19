-- Migration: Adicionar colunas faltantes na tabela escalacoes
-- Data: 2026-02-19

-- Verificar colunas existentes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'escalacoes' 
ORDER BY ordinal_position;

-- Adicionar coluna jogadores_por_posicao (JSONB)
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS jogadores_por_posicao JSONB DEFAULT '{}'::jsonb;

-- Adicionar coluna posicoes_customizadas (JSONB)  
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS posicoes_customizadas JSONB DEFAULT '{}'::jsonb;

-- Adicionar coluna banco (JSONB)
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS banco JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna status_escalacao (text)
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS status_escalacao TEXT DEFAULT 'provavel';

-- Verificar colunas após alteração
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'escalacoes' 
ORDER BY ordinal_position;
