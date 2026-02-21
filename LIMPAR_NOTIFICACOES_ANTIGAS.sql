-- ============================================
-- LIMPAR NOTIFICAÇÕES ANTIGAS DE CONVITE
-- ============================================

-- Remover todas as notificações de convite antigas
DELETE FROM public.notificacoes 
WHERE tipo IN ('convite_ingresso', 'convite_aceito', 'convite_recusado', 'jogador_saiu', 'novo_jogador');

-- Verificar o resultado
SELECT tipo, COUNT(*) as total 
FROM public.notificacoes 
GROUP BY tipo 
ORDER BY total DESC;
