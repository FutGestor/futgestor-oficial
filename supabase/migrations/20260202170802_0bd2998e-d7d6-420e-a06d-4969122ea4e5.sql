-- Permitir email_contato como nullable (opcional)
ALTER TABLE public.solicitacoes_jogo 
  ALTER COLUMN email_contato DROP NOT NULL;

-- Garantir que telefone_contato seja obrigatorio
ALTER TABLE public.solicitacoes_jogo 
  ALTER COLUMN telefone_contato SET NOT NULL;