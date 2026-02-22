-- ============================================
-- DEPLOY PRODUÇÃO - FutGestor Pro v2.1
-- Execute este script no Supabase de produção
-- ============================================

-- 1. CRIAR TABELA DE SOLICITAÇÕES
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

COMMENT ON TABLE public.solicitacoes_ingresso IS 'Solicitações de convite entre times';

CREATE INDEX IF NOT EXISTS idx_solicitacoes_jogador ON public.solicitacoes_ingresso(jogador_user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_time ON public.solicitacoes_ingresso(time_alvo_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes_ingresso(status);

-- 2. RLS POLICIES
ALTER TABLE public.solicitacoes_ingresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jogador pode ver suas solicitacoes" ON public.solicitacoes_ingresso;
CREATE POLICY "Jogador pode ver suas solicitacoes"
  ON public.solicitacoes_ingresso FOR SELECT
  USING (jogador_user_id = auth.uid());

DROP POLICY IF EXISTS "Admin pode ver solicitacoes do time" ON public.solicitacoes_ingresso;
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

DROP POLICY IF EXISTS "Usuário pode criar solicitacao" ON public.solicitacoes_ingresso;
CREATE POLICY "Usuário pode criar solicitacao"
  ON public.solicitacoes_ingresso FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Jogador pode atualizar sua solicitacao" ON public.solicitacoes_ingresso;
CREATE POLICY "Jogador pode atualizar sua solicitacao"
  ON public.solicitacoes_ingresso FOR UPDATE
  USING (jogador_user_id = auth.uid());

-- 3. TRIGGER: Notificar jogador quando receber convite
CREATE OR REPLACE FUNCTION public.notify_solicitacao_ingresso()
RETURNS TRIGGER AS $$
DECLARE
  v_time_nome TEXT;
BEGIN
  SELECT nome INTO v_time_nome FROM public.teams WHERE id = NEW.time_alvo_id;

  INSERT INTO public.notificacoes (
    user_id, tipo, titulo, mensagem, link, dados, team_id
  ) VALUES (
    NEW.jogador_user_id,
    'convite_ingresso',
    'Novo convite!',
    'Você recebeu um convite para joinar o time ' || COALESCE(v_time_nome, 'Um time'),
    '/convite/' || NEW.id,
    jsonb_build_object(
      'solicitacao_id', NEW.id,
      'time_id', NEW.time_alvo_id,
      'time_nome', v_time_nome,
      'mensagem', NEW.mensagem
    ),
    NEW.time_alvo_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_solicitacao_ingresso ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_solicitacao_ingresso
  AFTER INSERT ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_solicitacao_ingresso();

-- 4. TRIGGER: Notificações de transferência (resenha)
CREATE OR REPLACE FUNCTION public.notify_transferencia_resenha()
RETURNS TRIGGER AS $$
DECLARE
  v_jogador_nome TEXT;
  v_time_origem_id UUID;
  v_time_destino_id UUID;
  v_time_origem_nome TEXT;
  v_time_destino_nome TEXT;
  v_jogador_id UUID;
BEGIN
  IF OLD.status = 'aceito' OR NEW.status != 'aceito' THEN
    RETURN NEW;
  END IF;

  SELECT si.jogador_nome, si.time_alvo_id, j.id, j.team_id
  INTO v_jogador_nome, v_time_destino_id, v_jogador_id, v_time_origem_id
  FROM public.solicitacoes_ingresso si
  JOIN public.jogadores j ON j.user_id = si.jogador_user_id
  WHERE si.id = NEW.id;

  SELECT nome INTO v_time_origem_nome FROM public.teams WHERE id = v_time_origem_id;
  SELECT nome INTO v_time_destino_nome FROM public.teams WHERE id = v_time_destino_id;

  -- Notificar time que PERDEU o jogador (MENSAGEM NEGATIVA)
  IF v_time_origem_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link, team_id, dados)
    SELECT p.id, 'transferencia_saida', '😢 PERDA NO ELENCO',
      v_jogador_nome || ' deixou o ' || COALESCE(v_time_origem_nome, 'time') || ' e foi para o ' || COALESCE(v_time_destino_nome, 'novo time') || '. Uma pena, mas desejamos sucesso na nova jornada!',
      '/transferencia-saida?jogador=' || v_jogador_id, v_time_origem_id,
      jsonb_build_object('jogador_id', v_jogador_id, 'jogador_nome', v_jogador_nome, 'time_destino', v_time_destino_nome, 'tipo', 'saida')
    FROM public.profiles p WHERE p.team_id = v_time_origem_id;
  END IF;

  -- Notificar time que GANHOU o jogador (MENSAGEM POSITIVA)
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link, team_id, dados)
  SELECT p.id, 'transferencia_chegada', '🎉 REFORÇO DE PESO!',
    v_jogador_nome || ' é o novo reforço do ' || COALESCE(v_time_destino_nome, 'time') || '! Contratação de peso para fortalecer o elenco. 🚀⚽',
    '/transferencia?jogador=' || v_jogador_id, v_time_destino_id,
    jsonb_build_object('jogador_id', v_jogador_id, 'jogador_nome', v_jogador_nome, 'time_origem', v_time_origem_nome, 'tipo', 'chegada')
  FROM public.profiles p WHERE p.team_id = v_time_destino_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_transferencia_resenha ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_transferencia_resenha
  AFTER UPDATE ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_transferencia_resenha();

-- 5. TRIGGER vazio para resposta (não duplicar notificações)
CREATE OR REPLACE FUNCTION public.notify_resposta_convite()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_resposta_convite ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_resposta_convite
  AFTER UPDATE ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resposta_convite();

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 'Tabela criada: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'solicitacoes_ingresso';

SELECT 'Triggers criados: ' || COUNT(*) as total
FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND event_object_table = 'solicitacoes_ingresso';
