-- ============================================
-- TRIGGER: Notificações de transferência para TODOS os membros do time
-- ============================================

-- Função para notificar todos os membros do time sobre transferência
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
  -- Só executar se status mudou para 'aceito'
  IF OLD.status = 'aceito' OR NEW.status != 'aceito' THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do convite
  SELECT 
    si.jogador_nome,
    si.time_alvo_id,
    j.id,
    j.team_id
  INTO 
    v_jogador_nome,
    v_time_destino_id,
    v_jogador_id,
    v_time_origem_id
  FROM public.solicitacoes_ingresso si
  JOIN public.jogadores j ON j.user_id = si.jogador_user_id
  WHERE si.id = NEW.id;

  -- Buscar nomes dos times
  SELECT nome INTO v_time_origem_nome FROM public.teams WHERE id = v_time_origem_id;
  SELECT nome INTO v_time_destino_nome FROM public.teams WHERE id = v_time_destino_id;

  -- Notificar TODOS os membros do time de origem (que perdeu o jogador)
  IF v_time_origem_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      link,
      team_id,
      dados
    )
    SELECT 
      p.id,
      'transferencia_saida',
      '🚨 BOMBA NO MERCADO!',
      v_jogador_nome || ' deixou o time e foi parar no ' || COALESCE(v_time_destino_nome, 'novo time') || '! Contratação de peso para fortalecer o elenco adversário.',
      '/transferencia?jogador=' || v_jogador_id,
      v_time_origem_id,
      jsonb_build_object(
        'jogador_id', v_jogador_id,
        'jogador_nome', v_jogador_nome,
        'time_destino', v_time_destino_nome,
        'tipo', 'saida'
      )
    FROM public.profiles p
    WHERE p.team_id = v_time_origem_id;
  END IF;

  -- Notificar TODOS os membros do time de destino (que ganhou o jogador)
  INSERT INTO public.notificacoes (
    user_id,
    tipo,
    titulo,
    mensagem,
    link,
    team_id,
    dados
  )
  SELECT 
    p.id,
    'transferencia_chegada',
    '🎉 REFORÇO DE PESO!',
    v_jogador_nome || ' é o novo reforço do ' || COALESCE(v_time_destino_nome, 'time') || '! Contratação de peso para fortalecer o elenco. 🚀⚽',
    '/transferencia?jogador=' || v_jogador_id,
    v_time_destino_id,
    jsonb_build_object(
      'jogador_id', v_jogador_id,
      'jogador_nome', v_jogador_nome,
      'time_origem', v_time_origem_nome,
      'tipo', 'chegada'
    )
  FROM public.profiles p
  WHERE p.team_id = v_time_destino_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, não impedir a operação principal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS trg_notify_transferencia_resenha ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_transferencia_resenha
  AFTER UPDATE ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_transferencia_resenha();

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'solicitacoes_ingresso'
  AND trigger_name = 'trg_notify_transferencia_resenha';
