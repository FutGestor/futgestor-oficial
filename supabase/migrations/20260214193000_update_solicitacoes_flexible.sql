-- Migração para ajustar solicitacoes_jogo para desafios diretos entre times
ALTER TABLE public.solicitacoes_jogo 
  ALTER COLUMN email_contato DROP NOT NULL,
  ALTER COLUMN data_preferida DROP NOT NULL,
  ALTER COLUMN horario_preferido DROP NOT NULL,
  ALTER COLUMN local_sugerido DROP NOT NULL;

-- Adicionar campo para escudo do time que está enviando o desafio
ALTER TABLE public.solicitacoes_jogo 
  ADD COLUMN IF NOT EXISTS escudo_url_adversario TEXT;
