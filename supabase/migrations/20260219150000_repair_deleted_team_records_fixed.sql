-- REPARAÇÃO: Restaurar registros is_casa=true deletados e corrigir referências
-- VERSÃO CORRIGIDA (sem coluna 'estado' que não existe)

-- Passo 1: Recriar registros is_casa=true para times que não têm
INSERT INTO times (team_id, nome, escudo_url, is_casa, cidade, ativo)
SELECT 
    t.id as team_id,
    t.nome,
    t.escudo_url,
    true as is_casa,
    t.cidade,
    true as ativo
FROM teams t
LEFT JOIN times tm ON tm.team_id = t.id AND tm.is_casa = true
WHERE tm.id IS NULL;

-- Passo 2: Sincronizar dados de teams -> times (atualizar registros existentes)
UPDATE times tm
SET 
    nome = t.nome,
    escudo_url = t.escudo_url,
    cidade = t.cidade
FROM teams t
WHERE tm.team_id = t.id 
  AND tm.is_casa = true
  AND (
    tm.nome IS DISTINCT FROM t.nome OR
    tm.escudo_url IS DISTINCT FROM t.escudo_url OR
    tm.cidade IS DISTINCT FROM t.cidade
  );

-- Passo 3: Corrigir jogos que têm time_adversario_id NULL ou inválido
UPDATE jogos j
SET time_adversario_id = (
    SELECT id FROM times 
    WHERE team_id = j.team_id 
    AND is_casa = true 
    LIMIT 1
)
WHERE time_adversario_id IS NULL 
   OR time_adversario_id NOT IN (SELECT id FROM times);

-- Passo 4: Limpar registros is_casa=false obsoletos que não têm jogos vinculados
DELETE FROM times 
WHERE is_casa = false 
  AND id NOT IN (SELECT DISTINCT time_adversario_id FROM jogos WHERE time_adversario_id IS NOT NULL);

-- Verificação: Contar resultados
SELECT 
    'times is_casa=true criados/restaurados' as verificacao,
    COUNT(*) as total
FROM times 
WHERE is_casa = true;

SELECT 
    'jogos com time_adversario_id NULL' as verificacao,
    COUNT(*) as total
FROM jogos 
WHERE time_adversario_id IS NULL;
