-- Migration: Adicionar RLS para tabelas ML (permissão de leitura pública)
-- Data: 2026-02-19

-- Habilitar RLS nas tabelas ML (se ainda não estiver)
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_jogador_posicoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "Allow public read access" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow public read access" ON ml_jogador_posicoes;

-- Criar políticas de leitura pública
CREATE POLICY "Allow public read access" 
ON ml_escalacao_padroes 
FOR SELECT 
TO PUBLIC 
USING (true);

CREATE POLICY "Allow public read access" 
ON ml_jogador_posicoes 
FOR SELECT 
TO PUBLIC 
USING (true);

-- Políticas para inserção (apenas usuários autenticados)
DROP POLICY IF EXISTS "Allow authenticated insert" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Allow authenticated insert" ON ml_jogador_posicoes;

CREATE POLICY "Allow authenticated insert" 
ON ml_escalacao_padroes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" 
ON ml_jogador_posicoes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
