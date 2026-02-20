-- Trigger para criar notificações quando uma nova solicitação de jogo é recebida
-- Apenas admins do time recebem a notificação

-- Função para criar notificações para admins do time
CREATE OR REPLACE FUNCTION public.notify_admins_new_solicitacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
  team_name TEXT;
BEGIN
  -- Só executa se tiver team_id (solicitação direta para um time)
  IF NEW.team_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do time
  SELECT nome INTO team_name FROM public.teams WHERE id = NEW.team_id;

  -- Criar notificação para cada admin do time
  FOR admin_record IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.team_id = NEW.team_id
      AND ur.role IN ('admin', 'super_admin')
  LOOP
    INSERT INTO public.notificacoes (
      user_id,
      team_id,
      tipo,
      titulo,
      mensagem,
      link,
      lida,
      created_at
    ) VALUES (
      admin_record.user_id,
      NEW.team_id,
      'solicitacao_jogo',
      'Nova solicitação de jogo!',
      COALESCE(NEW.nome_time, 'Um time') || ' solicitou um jogo contra ' || COALESCE(team_name, 'seu time') || '.',
      '/time/' || (SELECT slug FROM public.teams WHERE id = NEW.team_id) || '/solicitacoes',
      false,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_new_solicitacao_notify_admins ON public.solicitacoes_jogo;

CREATE TRIGGER on_new_solicitacao_notify_admins
  AFTER INSERT ON public.solicitacoes_jogo
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_solicitacao();

-- Adicionar ícone para o tipo de notificação (se a tabela de ícones existir)
-- Isso é opcional e depende de como os ícones são gerenciados no frontend

COMMENT ON FUNCTION public.notify_admins_new_solicitacao() IS 
'Cria notificações para todos os admins do time quando uma nova solicitação de jogo é recebida';
