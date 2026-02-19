-- Migration: Tornar team_id obrigatório na tabela jogos
-- Data: 2026-02-19

-- Primeiro, verificar se há jogos sem team_id
SELECT COUNT(*) as jogos_sem_team_id 
FROM jogos 
WHERE team_id IS NULL;

-- Se houver jogos sem team_id, precisamos definir um valor padrão ou deletar
-- Aqui vamos definir um valor padrão baseado no time do usuário admin
-- (Isso é apenas um exemplo, ajuste conforme necessário)

-- Tornar a coluna NOT NULL
ALTER TABLE jogos 
ALTER COLUMN team_id SET NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN jogos.team_id IS 'ID do time dono do jogo (obrigatório)';
