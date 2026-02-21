-- ============================================
-- CORRIGIR: Jogador CODIGO deve estar apenas no Time 2 (unidos-ag)
-- ============================================

-- Atualizar o jogador CODIGO para o time correto (unidos-ag)
UPDATE public.jogadores 
SET team_id = (SELECT id FROM public.teams WHERE slug = 'unidos-ag')
WHERE nome = 'CODIGO';

-- Atualizar o profile do jogador CODIGO para o time correto
UPDATE public.profiles 
SET team_id = (SELECT id FROM public.teams WHERE slug = 'unidos-ag')
WHERE id IN (
  SELECT user_id FROM public.jogadores WHERE nome = 'CODIGO'
);

-- Verificar o resultado
SELECT j.nome, j.team_id, t.nome as time_nome, t.slug
FROM public.jogadores j
JOIN public.teams t ON t.id = j.team_id
WHERE j.nome = 'CODIGO';
