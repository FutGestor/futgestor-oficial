-- ============================================
-- CORRIGIR: Trigger de resposta do convite
-- ============================================

-- Atualizar função para não criar notificação duplicada
-- (já criamos no hook do frontend)
CREATE OR REPLACE FUNCTION public.notify_resposta_convite()
RETURNS TRIGGER AS $$
BEGIN
  -- Não fazer nada - as notificações são criadas no frontend
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trg_notify_resposta_convite ON public.solicitacoes_ingresso;
CREATE TRIGGER trg_notify_resposta_convite
  AFTER UPDATE ON public.solicitacoes_ingresso
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resposta_convite();
