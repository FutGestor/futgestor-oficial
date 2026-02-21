-- Verificar se ainda há notificações de convite
SELECT id, tipo, titulo, mensagem, link, dados, created_at
FROM public.notificacoes 
WHERE tipo LIKE '%convite%' OR tipo LIKE '%jogador%'
ORDER BY created_at DESC;

-- Verificar se há dados de convite nas notificações
SELECT id, tipo, dados->>'solicitacao_id' as solicitacao_id
FROM public.notificacoes 
WHERE dados->>'solicitacao_id' IS NOT NULL;
