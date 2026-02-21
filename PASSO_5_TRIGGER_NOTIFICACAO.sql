-- ============================================
-- PASSO 5: Criar trigger de notificação para novos convites
-- ============================================

-- Função do trigger
CREATE OR REPLACE FUNCTION public.notify_solicitacao_ingresso()
RETURNS TRIGGER AS $$
DECLARE
  v_time_nome TEXT;
BEGIN
  -- Buscar nome do time que está convidando
  SELECT nome INTO v_time_nome
  FROM public.teams
  WHERE id = NEW.time_alvo_id;

  -- Criar notificação para o jogador convidado
  INSERT INTO public.notificacoes (
    user_id,
    tipo,
    titulo,
    mensagem,
    link,
    dados,
    team_id
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

-- Criar o trigger
DROP TRIGGER IF EXISTS trg_notify_solicitacao_ingresso ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_solicitacao_ingresso
  AFTER INSERT ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_solicitacao_ingresso();

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'solicitacoes_ingresso';
