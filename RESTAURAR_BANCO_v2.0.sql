-- ============================================
-- RESTAURAÇÃO DO BANCO - v2.0-stable-20250221-final
-- ============================================
-- Execute este script para limpar dados de teste 
-- e restaurar o estado funcional do ponto de restauração

-- ============================================
-- 1. LIMPAR TABELAS DE TESTE (se existirem)
-- ============================================

-- Remover tabela de solicitações de ingresso se existir
DROP TABLE IF EXISTS public.solicitacoes_ingresso CASCADE;

-- Remover triggers relacionados a convites
DROP TRIGGER IF EXISTS trg_notify_solicitacao_ingresso ON public.solicitacoes_ingresso;
DROP TRIGGER IF EXISTS trg_notify_resposta_convite ON public.solicitacoes_ingresso;

-- Remover funções relacionadas a convites
DROP FUNCTION IF EXISTS public.notify_solicitacao_ingresso();
DROP FUNCTION IF EXISTS public.notify_resposta_convite();

-- ============================================
-- 2. LIMPAR NOTIFICAÇÕES DE TESTE
-- ============================================

-- Remover notificações de tipos específicos de teste
DELETE FROM public.notificacoes 
WHERE tipo IN ('convite_ingresso', 'convite_aceito', 'convite_recusado', 'jogador_saiu', 'novo_jogador');

-- ============================================
-- 3. VERIFICAÇÃO DE INTEGRIDADE
-- ============================================

-- Verificar se todos os jogadores têm um time válido
SELECT 
  j.nome,
  j.team_id,
  t.nome as time_nome
FROM public.jogadores j
LEFT JOIN public.teams t ON t.id = j.team_id
WHERE j.ativo = true
ORDER BY t.nome, j.nome;

-- Verificar se todos os profiles têm team_id consistente
SELECT 
  p.id,
  p.nome,
  p.team_id,
  j.team_id as jogador_team_id
FROM public.profiles p
LEFT JOIN public.jogadores j ON j.user_id = p.id
WHERE p.team_id IS NOT NULL
  AND (j.team_id IS NULL OR j.team_id != p.team_id);

-- ============================================
-- 4. CORRIGIR INCONSISTÊNCIAS (se encontradas)
-- ============================================

-- Se houver jogadores sem time, desativá-los
-- UPDATE public.jogadores SET ativo = false WHERE team_id IS NULL;

-- Se houver profiles com team_id diferente do jogador, sincronizar
-- UPDATE public.profiles p
-- SET team_id = j.team_id
-- FROM public.jogadores j
-- WHERE j.user_id = p.id
--   AND p.team_id != j.team_id;

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Contagem de jogadores por time
SELECT 
  t.nome as time_nome,
  t.slug,
  COUNT(j.id) as total_jogadores
FROM public.teams t
LEFT JOIN public.jogadores j ON j.team_id = t.id AND j.ativo = true
GROUP BY t.id, t.nome, t.slug
ORDER BY t.nome;

-- ============================================
-- FIM DO SCRIPT DE RESTAURAÇÃO
-- ============================================
