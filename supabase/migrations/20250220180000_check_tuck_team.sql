-- Verificar todos os dados do time "tuck"
SELECT 
    t.id, 
    t.nome, 
    t.slug,
    t.ativo,
    t.cidade,
    t.uf,
    t.modalidade,
    t.faixa_etaria,
    t.escudo_url,
    t.created_at,
    t.user_id
FROM teams t
WHERE t.nome = 'tuck';

-- Verificar se há jogadores ativos no time
SELECT COUNT(*) as jogadores_ativos
FROM jogadores 
WHERE team_id = (SELECT id FROM teams WHERE nome = 'tuck')
AND ativo = true;

-- Verificar se há alguma constraint ou trigger que possa afetar
SELECT 
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'teams';
