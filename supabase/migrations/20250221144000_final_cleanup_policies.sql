-- ============================================
-- FINAL CLEANUP: Remover TODAS as políticas duplicadas
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS DUPLICADAS/CONFLITANTES
-- ============================================

-- chamados: remover duplicatas de SELECT
DROP POLICY IF EXISTS "Usuário vê seus chamados" ON public.chamados;

-- profiles: remover duplicatas de UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- resultados: remover duplicatas de SELECT
DROP POLICY IF EXISTS "Public can view resultados by team" ON public.resultados;

-- teams: remover duplicatas de INSERT
DROP POLICY IF EXISTS "Insert teams" ON public.teams;

-- notificacoes: remover duplicatas de SELECT
DROP POLICY IF EXISTS "users_view_notifications" ON public.notificacoes;

-- ml_escalacao_padroes: remover duplicatas de SELECT
DROP POLICY IF EXISTS "team_members_view_ml_patterns" ON public.ml_escalacao_padroes;

-- ============================================
-- 2. GARANTIR RLS ATIVO EM TODAS AS TABELAS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacao_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aviso_leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmacoes_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_destaque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas_partida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_push ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenca_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_jogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_ingresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votacao_craque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_jogador_posicoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. GARANTIR PERMISSÕES BÁSICAS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT cmd, ', ' ORDER BY cmd) as commands
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;
