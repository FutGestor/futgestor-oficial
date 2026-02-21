-- ============================================
-- RESTORE POINT COMPLETO - FutGestorPro
-- Data: 21/02/2025
-- Descrição: Estado funcional completo do banco
-- ============================================

-- ============================================
-- 1. ESTRUTURA DAS TABELAS PRINCIPAIS
-- ============================================

-- Tabela: teams (times principais)
-- Já existe, apenas garantir RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Políticas teams
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can create teams" ON public.teams;
CREATE POLICY "Authenticated can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Team admins can update own team" ON public.teams;
CREATE POLICY "Team admins can update own team" ON public.teams FOR UPDATE USING (is_team_admin(auth.uid(), id));

-- Tabela: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: jogadores
ALTER TABLE public.jogadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view jogadores" ON public.jogadores;
CREATE POLICY "Anyone can view jogadores" ON public.jogadores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow players to insert their own record" ON public.jogadores;
CREATE POLICY "Allow players to insert their own record" ON public.jogadores FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own jogador" ON public.jogadores;
CREATE POLICY "Users can update own jogador" ON public.jogadores FOR UPDATE USING ((user_id = auth.uid()) OR (id IN (SELECT jogador_id FROM profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Team admins can manage jogadores" ON public.jogadores;
CREATE POLICY "Team admins can manage jogadores" ON public.jogadores FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: jogos
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view jogos" ON public.jogos;
CREATE POLICY "Public can view jogos" ON public.jogos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage jogos" ON public.jogos;
CREATE POLICY "Team admins can manage jogos" ON public.jogos FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: confirmacoes_presenca
ALTER TABLE public.confirmacoes_presenca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view confirmacoes" ON public.confirmacoes_presenca;
CREATE POLICY "Anyone can view confirmacoes" ON public.confirmacoes_presenca FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own confirmacao or admin" ON public.confirmacoes_presenca;
CREATE POLICY "Users can insert own confirmacao or admin" ON public.confirmacoes_presenca FOR INSERT WITH CHECK (
  is_team_admin(auth.uid(), team_id)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.jogador_id = confirmacoes_presenca.jogador_id
  )
);

DROP POLICY IF EXISTS "Users can update own confirmacao or admin" ON public.confirmacoes_presenca;
CREATE POLICY "Users can update own confirmacao or admin" ON public.confirmacoes_presenca FOR UPDATE USING (
  is_team_admin(auth.uid(), team_id)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.jogador_id = confirmacoes_presenca.jogador_id
  )
);

DROP POLICY IF EXISTS "Team admins can delete confirmacoes" ON public.confirmacoes_presenca;
CREATE POLICY "Team admins can delete confirmacoes" ON public.confirmacoes_presenca FOR DELETE USING (is_team_admin(auth.uid(), team_id));

-- Tabela: transacoes
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes;
CREATE POLICY "Anyone can view transacoes" ON public.transacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage transacoes" ON public.transacoes;
CREATE POLICY "Team admins can manage transacoes" ON public.transacoes FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: resultados
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view resultados" ON public.resultados;
CREATE POLICY "Public can view resultados" ON public.resultados FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage resultados" ON public.resultados;
CREATE POLICY "Team admins can manage resultados" ON public.resultados FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: escalacoes
ALTER TABLE public.escalacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published escalacoes" ON public.escalacoes;
CREATE POLICY "Public can view published escalacoes" ON public.escalacoes FOR SELECT USING (publicada = true);

DROP POLICY IF EXISTS "Team admins can manage escalacoes" ON public.escalacoes;
CREATE POLICY "Team admins can manage escalacoes" ON public.escalacoes FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: escalacao_jogadores
ALTER TABLE public.escalacao_jogadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published escalacao jogadores" ON public.escalacao_jogadores;
CREATE POLICY "Public can view published escalacao jogadores" ON public.escalacao_jogadores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM escalacoes e
    WHERE e.id = escalacao_jogadores.escalacao_id AND e.publicada = true
  )
);

DROP POLICY IF EXISTS "Team admins can manage escalacao_jogadores" ON public.escalacao_jogadores;
CREATE POLICY "Team admins can manage escalacao_jogadores" ON public.escalacao_jogadores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM escalacoes e
    WHERE e.id = escalacao_jogadores.escalacao_id AND is_team_admin(auth.uid(), e.team_id)
  )
);

-- Tabela: estatisticas_partida
ALTER TABLE public.estatisticas_partida ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Public can view estatisticas" ON public.estatisticas_partida FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team admins can manage estatisticas" ON public.estatisticas_partida FOR ALL USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: avisos
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team admins can manage avisos" ON public.avisos;
CREATE POLICY "Team admins can manage avisos" ON public.avisos FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: aviso_leituras
ALTER TABLE public.aviso_leituras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê suas leituras" ON public.aviso_leituras;
CREATE POLICY "Usuário vê suas leituras" ON public.aviso_leituras FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário marca como lido" ON public.aviso_leituras;
CREATE POLICY "Usuário marca como lido" ON public.aviso_leituras FOR INSERT WITH CHECK (true);

-- Tabela: votos_destaque
ALTER TABLE public.votos_destaque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view votos" ON public.votos_destaque;
CREATE POLICY "Public can view votos" ON public.votos_destaque FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert votos" ON public.votos_destaque;
CREATE POLICY "Authenticated can insert votos" ON public.votos_destaque FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own voto" ON public.votos_destaque;
CREATE POLICY "Users update own voto" ON public.votos_destaque FOR UPDATE USING (auth.uid() = votante_id);

DROP POLICY IF EXISTS "Team admins can delete votos" ON public.votos_destaque;
CREATE POLICY "Team admins can delete votos" ON public.votos_destaque FOR DELETE USING (is_team_admin(auth.uid(), team_id));

-- Tabela: notificacoes
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notificacoes;
CREATE POLICY "Users view own notifications" ON public.notificacoes FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_insert_notifications" ON public.notificacoes;
CREATE POLICY "admins_insert_notifications" ON public.notificacoes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_update_notifications" ON public.notificacoes;
CREATE POLICY "users_update_notifications" ON public.notificacoes FOR UPDATE USING (user_id = auth.uid() OR is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "users_delete_notifications" ON public.notificacoes;
CREATE POLICY "users_delete_notifications" ON public.notificacoes FOR DELETE USING (user_id = auth.uid() OR is_super_admin());

-- Tabela: notificacoes_push
ALTER TABLE public.notificacoes_push ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas suas notificações" ON public.notificacoes_push;
CREATE POLICY "Usuários veem apenas suas notificações" ON public.notificacoes_push FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários atualizam suas próprias notificações" ON public.notificacoes_push;
CREATE POLICY "Usuários atualizam suas próprias notificações" ON public.notificacoes_push FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Trigger pode inserir notificações" ON public.notificacoes_push;
CREATE POLICY "Trigger pode inserir notificações" ON public.notificacoes_push FOR INSERT WITH CHECK (true);

-- Tabela: chamados
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own chamados" ON public.chamados;
CREATE POLICY "Users view own chamados" ON public.chamados FOR SELECT USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "Usuário cria chamado" ON public.chamados;
CREATE POLICY "Usuário cria chamado" ON public.chamados FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuário pode atualizar seus chamados" ON public.chamados;
CREATE POLICY "Usuário pode atualizar seus chamados" ON public.chamados FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admin atualiza chamados" ON public.chamados;
CREATE POLICY "Super admin atualiza chamados" ON public.chamados FOR UPDATE TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Usuários podem excluir seus próprios chamados" ON public.chamados;
CREATE POLICY "Usuários podem excluir seus próprios chamados" ON public.chamados FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Tabela: chamado_mensagens
ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver mensagens do chamado" ON public.chamado_mensagens;
CREATE POLICY "Ver mensagens do chamado" ON public.chamado_mensagens FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chamados
    WHERE chamados.id = chamado_mensagens.chamado_id
      AND (chamados.user_id = auth.uid() OR is_super_admin())
  )
);

DROP POLICY IF EXISTS "Enviar mensagem no chamado" ON public.chamado_mensagens;
CREATE POLICY "Enviar mensagem no chamado" ON public.chamado_mensagens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can insert messages" ON public.chamado_mensagens;
CREATE POLICY "Super admins can insert messages" ON public.chamado_mensagens FOR INSERT WITH CHECK (true);

-- Tabela: chamado_anexos
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver anexos do chamado" ON public.chamado_anexos;
CREATE POLICY "Ver anexos do chamado" ON public.chamado_anexos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chamados c
    WHERE c.id = chamado_anexos.chamado_id
      AND (c.user_id = auth.uid() OR is_super_admin())
  )
);

DROP POLICY IF EXISTS "Criar anexos do chamado" ON public.chamado_anexos;
CREATE POLICY "Criar anexos do chamado" ON public.chamado_anexos FOR INSERT WITH CHECK (true);

-- Tabela: times
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view times" ON public.times;
CREATE POLICY "Public can view times" ON public.times FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage times" ON public.times;
CREATE POLICY "Team admins can manage times" ON public.times FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own admin role for new team" ON public.user_roles;
CREATE POLICY "Users can insert own admin role for new team" ON public.user_roles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Team admins can manage roles" ON public.user_roles;
CREATE POLICY "Team admins can manage roles" ON public.user_roles FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: leagues
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view leagues" ON public.leagues;
CREATE POLICY "Public can view leagues" ON public.leagues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage leagues" ON public.leagues;
CREATE POLICY "Team admins can manage leagues" ON public.leagues FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: league_teams
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view league_teams" ON public.league_teams;
CREATE POLICY "Public can view league_teams" ON public.league_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage league_teams" ON public.league_teams;
CREATE POLICY "Team admins can manage league_teams" ON public.league_teams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM leagues l
    WHERE l.id = league_teams.league_id AND is_team_admin(auth.uid(), l.team_id)
  )
);

-- Tabela: league_matches
ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view league_matches" ON public.league_matches;
CREATE POLICY "Public can view league_matches" ON public.league_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage league_matches" ON public.league_matches;
CREATE POLICY "Team admins can manage league_matches" ON public.league_matches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM leagues l
    WHERE l.id = league_matches.league_id AND is_team_admin(auth.uid(), l.team_id)
  )
);

-- Tabela: subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view subscriptions" ON public.subscriptions;
CREATE POLICY "Public can view subscriptions" ON public.subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Team admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Team admins can manage subscriptions" ON public.subscriptions FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: saas_payments
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read saas_payments" ON public.saas_payments;
CREATE POLICY "Super admins can read saas_payments" ON public.saas_payments FOR SELECT USING (is_super_admin());

-- Tabela: team_sensitive_data
ALTER TABLE public.team_sensitive_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only team admins can view sensitive data" ON public.team_sensitive_data;
CREATE POLICY "Only team admins can view sensitive data" ON public.team_sensitive_data FOR SELECT USING (is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Only team admins can manage sensitive data" ON public.team_sensitive_data;
CREATE POLICY "Only team admins can manage sensitive data" ON public.team_sensitive_data FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: presenca_links
ALTER TABLE public.presenca_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read presenca_links by codigo" ON public.presenca_links;
CREATE POLICY "Public can read presenca_links by codigo" ON public.presenca_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team admins can manage presenca_links" ON public.presenca_links;
CREATE POLICY "Team admins can manage presenca_links" ON public.presenca_links FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: presencas
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_presencas" ON public.presencas;
CREATE POLICY "public_insert_presencas" ON public.presencas FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins_view_presencas" ON public.presencas;
CREATE POLICY "admins_view_presencas" ON public.presencas FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM presenca_links pl
    WHERE pl.id = presencas.link_id AND is_team_admin(auth.uid(), pl.team_id)
  )
);

DROP POLICY IF EXISTS "admins_update_presencas" ON public.presencas;
CREATE POLICY "admins_update_presencas" ON public.presencas FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM presenca_links pl
    WHERE pl.id = presencas.link_id AND is_team_admin(auth.uid(), pl.team_id)
  )
);

DROP POLICY IF EXISTS "admins_delete_presencas" ON public.presencas;
CREATE POLICY "admins_delete_presencas" ON public.presencas FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM presenca_links pl
    WHERE pl.id = presencas.link_id AND is_team_admin(auth.uid(), pl.team_id)
  )
);

-- Tabela: player_financeiro
ALTER TABLE public.player_financeiro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own financeiro" ON public.player_financeiro;
CREATE POLICY "Players can view own financeiro" ON public.player_financeiro FOR SELECT USING (
  jogador_id IN (SELECT profiles.jogador_id FROM profiles WHERE profiles.id = auth.uid())
  OR is_team_admin(auth.uid(), team_id)
);

DROP POLICY IF EXISTS "Team admins can manage player_financeiro" ON public.player_financeiro;
CREATE POLICY "Team admins can manage player_financeiro" ON public.player_financeiro FOR ALL USING (is_team_admin(auth.uid(), team_id));

-- Tabela: push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam apenas seus tokens" ON public.push_tokens;
CREATE POLICY "Usuários gerenciam apenas seus tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- Tabela: solicitacoes_jogo
ALTER TABLE public.solicitacoes_jogo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create solicitacao" ON public.solicitacoes_jogo;
CREATE POLICY "Anyone can create solicitacao" ON public.solicitacoes_jogo FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Team admins can view solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can view solicitacoes" ON public.solicitacoes_jogo FOR SELECT USING (is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can update solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can update solicitacoes" ON public.solicitacoes_jogo FOR UPDATE USING (is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can delete solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can delete solicitacoes" ON public.solicitacoes_jogo FOR DELETE USING (is_team_admin(auth.uid(), team_id));

-- Tabela: solicitacoes_ingresso
ALTER TABLE public.solicitacoes_ingresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solicitacoes_insert" ON public.solicitacoes_ingresso;
CREATE POLICY "solicitacoes_insert" ON public.solicitacoes_ingresso FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela: conquistas
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conquistas_select" ON public.conquistas;
CREATE POLICY "conquistas_select" ON public.conquistas FOR SELECT TO authenticated USING (
  desbloqueada = true OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND is_team_admin(auth.uid(), profiles.team_id))
);

-- Tabela: gols
ALTER TABLE public.gols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gols_select" ON public.gols;
CREATE POLICY "gols_select" ON public.gols FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.team_id = gols.team_id
  )
);

-- Tabela: achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_read_all" ON public.achievements;
CREATE POLICY "achievements_read_all" ON public.achievements FOR SELECT USING (true);

-- Tabela: player_achievements
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_achievements_read_all" ON public.player_achievements;
CREATE POLICY "player_achievements_read_all" ON public.player_achievements FOR SELECT USING (true);

-- Tabela: votacao_craque
ALTER TABLE public.votacao_craque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de votos" ON public.votacao_craque;
CREATE POLICY "Leitura pública de votos" ON public.votacao_craque FOR SELECT USING (true);

-- Tabela: ml_escalacao_padroes
ALTER TABLE public.ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view ml patterns" ON public.ml_escalacao_padroes;
CREATE POLICY "Public can view ml patterns" ON public.ml_escalacao_padroes FOR SELECT USING (true);

DROP POLICY IF EXISTS "team_admins_insert_ml_patterns" ON public.ml_escalacao_padroes;
CREATE POLICY "team_admins_insert_ml_patterns" ON public.ml_escalacao_padroes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_admins_update_ml_patterns" ON public.ml_escalacao_padroes;
CREATE POLICY "team_admins_update_ml_patterns" ON public.ml_escalacao_padroes FOR UPDATE TO authenticated USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

DROP POLICY IF EXISTS "team_admins_delete_ml_patterns" ON public.ml_escalacao_padroes;
CREATE POLICY "team_admins_delete_ml_patterns" ON public.ml_escalacao_padroes FOR DELETE TO authenticated USING (is_team_admin(auth.uid(), team_id) OR is_super_admin());

-- Tabela: ml_jogador_posicoes
ALTER TABLE public.ml_jogador_posicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_view_ml_positions" ON public.ml_jogador_posicoes;
CREATE POLICY "team_members_view_ml_positions" ON public.ml_jogador_posicoes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM jogadores j
    JOIN profiles p ON p.team_id = j.team_id
    WHERE j.id = ml_jogador_posicoes.jogador_id AND p.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "team_admins_insert_ml_positions" ON public.ml_jogador_posicoes;
CREATE POLICY "team_admins_insert_ml_positions" ON public.ml_jogador_posicoes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_admins_update_ml_positions" ON public.ml_jogador_posicoes;
CREATE POLICY "team_admins_update_ml_positions" ON public.ml_jogador_posicoes FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM jogadores j
    WHERE j.id = ml_jogador_posicoes.jogador_id AND is_team_admin(auth.uid(), j.team_id)
  )
);

DROP POLICY IF EXISTS "team_admins_delete_ml_positions" ON public.ml_jogador_posicoes;
CREATE POLICY "team_admins_delete_ml_positions" ON public.ml_jogador_posicoes FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM jogadores j
    WHERE j.id = ml_jogador_posicoes.jogador_id AND is_team_admin(auth.uid(), j.team_id)
  )
);

-- ============================================
-- 2. TABELAS DO CHAT (SEM RLS - ACESSO LIBERADO)
-- ============================================

-- chat_mensagens
ALTER TABLE public.chat_mensagens DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.chat_mensagens TO anon, authenticated;

-- chat_leituras
ALTER TABLE public.chat_leituras DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.chat_leituras TO anon, authenticated;

-- ============================================
-- 3. FUNÇÕES AUXILIARES
-- ============================================

-- Função: is_team_admin
CREATE OR REPLACE FUNCTION public.is_team_admin(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
      AND team_id = team_uuid 
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: get_user_team_id
CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID AS $$
DECLARE
  team_uuid UUID;
BEGIN
  SELECT team_id INTO team_uuid
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN team_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. PERMISSÕES GLOBAIS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================
SELECT 
    'Tabelas com RLS ativo' as check_item,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true

UNION ALL

SELECT 
    'Tabelas com RLS desativado (chat)' as check_item,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename IN ('chat_mensagens', 'chat_leituras')

UNION ALL

SELECT 
    'Total de políticas RLS' as check_item,
    COUNT(*)::int as count
FROM pg_policies 
WHERE schemaname = 'public';
