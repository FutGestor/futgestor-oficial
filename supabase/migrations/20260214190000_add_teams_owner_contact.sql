-- Adicionar coluna de contato do proprietário para suporte direto
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS owner_contact TEXT;

-- Comentário para documentar a finalidade
COMMENT ON COLUMN public.teams.owner_contact IS 'Número de WhatsApp oficial para recebimento de desafios e suporte';
