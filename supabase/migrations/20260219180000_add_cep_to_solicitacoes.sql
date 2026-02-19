-- Adicionar campo CEP na tabela de solicitacoes_jogo
ALTER TABLE public.solicitacoes_jogo ADD COLUMN IF NOT EXISTS cep text;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.solicitacoes_jogo.cep IS 'CEP do local onde será realizado o jogo (validação anti-spam)';
