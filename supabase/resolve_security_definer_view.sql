-- ==========================================================
-- CORREÇÃO DE SEGURANÇA: SECURITY DEFINER VIEW
-- ==========================================================
-- Este script redefine a view 'jogadores_public' para usar 
-- 'security_invoker = true'. 
--
-- ISSO É SEGURO: A view passará a respeitar as políticas de RLS 
-- que já existem na tabela 'jogadores'. Nenhuma funcionalidade 
-- existente será afetada.
-- ==========================================================

DROP VIEW IF EXISTS public.jogadores_public;

CREATE VIEW public.jogadores_public
WITH (security_invoker = true) AS
  SELECT id, nome, apelido, posicao, foto_url, numero, team_id, ativo
  FROM public.jogadores;

-- Comentário para auditoria
COMMENT ON VIEW public.jogadores_public IS 'View pública de jogadores usando security_invoker para conformidade com RLS.';
