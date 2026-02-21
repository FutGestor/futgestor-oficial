-- Verificar se a coluna ativo existe e os times marcados
SELECT 
    id, 
    nome, 
    slug,
    ativo,
    created_at
FROM teams 
ORDER BY nome;

-- Verificar se há times sem a coluna ativo (será null se a coluna não existir)
-- Se der erro, a coluna não existe
