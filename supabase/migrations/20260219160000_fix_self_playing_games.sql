-- CORREÇÃO: Jogos onde time está jogando contra si mesmo
-- Causa: time_adversario_id foi restaurado apontando para o próprio time

-- Passo 1: Identificar jogos onde time_adversario_id aponta para o próprio team_id
-- E tentar corrigir usando o nome do adversário

-- Primeiro, vamos ver quantos jogos estão nessa situação
SELECT 
    j.id,
    j.team_id,
    j.adversario,
    j.time_adversario_id,
    t.nome as nome_time_dono
FROM jogos j
JOIN times t ON t.id = j.time_adversario_id
WHERE j.team_id = t.team_id;  -- Time adversário é o mesmo time dono

-- Passo 2: Para esses jogos, tentar encontrar o time correto pelo nome
-- Se o campo 'adversario' tiver um nome, procurar um time correspondente
UPDATE jogos j
SET time_adversario_id = (
    -- Buscar um time que corresponda ao nome do adversário
    SELECT t.id 
    FROM times t
    JOIN teams tm ON tm.id = t.team_id
    WHERE (
        LOWER(t.nome) LIKE LOWER('%' || j.adversario || '%')
        OR LOWER(tm.nome) LIKE LOWER('%' || j.adversario || '%')
    )
    AND t.team_id != j.team_id  -- Não pode ser o próprio time
    LIMIT 1
)
WHERE j.time_adversario_id IN (
    -- Seleciona jogos onde time_adversario aponta para o próprio time
    SELECT t2.id 
    FROM times t2 
    WHERE t2.team_id = j.team_id
);

-- Passo 3: Para jogos que ainda estão com time_adversario_id apontando para si mesmo
-- Definir como NULL para correção manual
UPDATE jogos j
SET time_adversario_id = NULL
WHERE j.time_adversario_id IN (
    SELECT t.id 
    FROM times t 
    WHERE t.team_id = j.team_id
);

-- Verificação final
SELECT 
    'Jogos corrigidos (time_adversario_id NULL)' as status,
    COUNT(*) as total
FROM jogos 
WHERE time_adversario_id IS NULL;

SELECT 
    'Jogos onde time joga contra si mesmo' as status,
    COUNT(*) as total
FROM jogos j
JOIN times t ON t.id = j.time_adversario_id
WHERE j.team_id = t.team_id;
