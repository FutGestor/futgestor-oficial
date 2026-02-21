-- Limpar notificação antiga de convite
DELETE FROM public.notificacoes 
WHERE id = 'b9f9b321-e7c0-4d33-9e1f-e0c3526ecabd';

-- Verificar se foi removida
SELECT id, tipo, dados->>'solicitacao_id' as solicitacao_id
FROM public.notificacoes 
WHERE dados->>'solicitacao_id' IS NOT NULL;
