-- ============================================
-- PASSO 1: Criar tabela de solicitações de ingresso
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.solicitacoes_ingresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogador_nome TEXT NOT NULL,
  jogador_posicao TEXT,
  time_alvo_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  respondido_em TIMESTAMPTZ
);

-- Comentários
COMMENT ON TABLE public.solicitacoes_ingresso IS 'Solicitações de convite entre times';

-- Índices
CREATE INDEX IF NOT EXISTS idx_solicitacoes_jogador ON public.solicitacoes_ingresso(jogador_user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_time ON public.solicitacoes_ingresso(time_alvo_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes_ingresso(status);

-- Políticas RLS
ALTER TABLE public.solicitacoes_ingresso ENABLE ROW LEVEL SECURITY;

-- Jogador pode ver suas próprias solicitações
CREATE POLICY "Jogador pode ver suas solicitacoes"
  ON public.solicitacoes_ingresso FOR SELECT
  USING (jogador_user_id = auth.uid());

-- Admins do time podem ver solicitações enviadas para seu time
CREATE POLICY "Admin pode ver solicitacoes do time"
  ON public.solicitacoes_ingresso FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.team_id = solicitacoes_ingresso.time_alvo_id
        AND ur.role = 'admin'
    )
  );

-- Qualquer usuário autenticado pode criar solicitação (será validado no código)
CREATE POLICY "Usuário pode criar solicitacao"
  ON public.solicitacoes_ingresso FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Jogador pode atualizar sua própria solicitação (aceitar/recusar)
CREATE POLICY "Jogador pode atualizar sua solicitacao"
  ON public.solicitacoes_ingresso FOR UPDATE
  USING (jogador_user_id = auth.uid());

-- Verificar a tabela criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitacoes_ingresso'
ORDER BY ordinal_position;
