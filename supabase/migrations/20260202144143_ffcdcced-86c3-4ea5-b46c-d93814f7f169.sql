-- Criar enum para status da solicitacao
CREATE TYPE public.request_status AS ENUM ('pendente', 'aceita', 'recusada');

-- Criar tabela de solicitacoes
CREATE TABLE public.solicitacoes_jogo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_time text NOT NULL,
  email_contato text NOT NULL,
  telefone_contato text,
  data_preferida date NOT NULL,
  horario_preferido time NOT NULL,
  local_sugerido text NOT NULL,
  observacoes text,
  status public.request_status NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.solicitacoes_jogo ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode criar solicitacao
CREATE POLICY "Anyone can create solicitacao"
ON public.solicitacoes_jogo FOR INSERT
WITH CHECK (true);

-- Apenas admins podem ver
CREATE POLICY "Admins can view solicitacoes"
ON public.solicitacoes_jogo FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar
CREATE POLICY "Admins can update solicitacoes"
ON public.solicitacoes_jogo FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar
CREATE POLICY "Admins can delete solicitacoes"
ON public.solicitacoes_jogo FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_solicitacoes_jogo_updated_at
  BEFORE UPDATE ON public.solicitacoes_jogo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();