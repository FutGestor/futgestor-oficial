-- ============================================
-- CORRIGIR: Links das notificações de transferência
-- ============================================

-- Atualizar função do trigger com links corretos
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

  -- Notificar TODOS os membros do time de ORIGEM (que PERDEU o jogador) - MENSAGEM NEGATIVA
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
      '😢 PERDA NO ELENCO',
      v_jogador_nome || ' deixou o ' || COALESCE(v_time_origem_nome, 'time') || ' e foi para o ' || COALESCE(v_time_destino_nome, 'novo time') || '. Uma pena, mas desejamos sucesso na nova jornada!',
      '/transferencia-saida?jogador=' || v_jogador_id,
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

  -- Notificar TODOS os membros do time de DESTINO (que GANHOU o jogador) - MENSAGEM POSITIVA
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trg_notify_transferencia_resenha ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_transferencia_resenha
  AFTER UPDATE ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_transferencia_resenha();
