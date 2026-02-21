-- ============================================
-- CLEANUP: Remover políticas RLS duplicadas/conflitantes
-- ============================================

-- profiles: remover duplicatas de SELECT
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- profiles: remover duplicatas de INSERT  
DROP POLICY IF EXISTS "Insert self" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- profiles: remover duplicatas de UPDATE
DROP POLICY IF EXISTS "Update self" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- jogadores: remover duplicatas
DROP POLICY IF EXISTS "Allow players to select their own record" ON public.jogadores;
DROP POLICY IF EXISTS "Users can update their own player record" ON public.jogadores;
DROP POLICY IF EXISTS "Leitura pública de jogadores" ON public.jogadores;

-- notificacoes: remover duplicatas
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificacoes;

-- chamados: remover duplicatas
DROP POLICY IF EXISTS "Authenticated users can view chamados" ON public.chamados;

-- transacoes: garantir apenas as políticas corretas
DROP POLICY IF EXISTS "Team members can view transacoes" ON public.transacoes;

-- escalacoes: limpar
DROP POLICY IF EXISTS "Anyone can view published escalacoes" ON public.escalacoes;

-- resultados: limpar
DROP POLICY IF EXISTS "Anyone can view resultados" ON public.resultados;
DROP POLICY IF EXISTS "Leitura pública de estatísticas" ON public.estatisticas_partida;
DROP POLICY IF EXISTS "Public can view estatisticas" ON public.estatisticas_partida;

-- times: limpar
DROP POLICY IF EXISTS "Public can view times" ON public.times;

-- jogos: limpar
DROP POLICY IF EXISTS "Public can view jogos by team" ON public.jogos;

-- teams: limpar duplicatas
DROP POLICY IF EXISTS "Select teams" ON public.teams;
DROP POLICY IF EXISTS "Super admins can view all teams" ON public.teams;
DROP POLICY IF EXISTS "Public read teams by invite_code" ON public.teams;
DROP POLICY IF EXISTS "Public can view teams by slug" ON public.teams;
DROP POLICY IF EXISTS "Public can view teams by invite code" ON public.teams;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create team" ON public.teams;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teams;

-- user_roles: limpar duplicatas
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- votos_destaque: limpar
DROP POLICY IF EXISTS "Permitir select para todos" ON public.votos_destaque;
DROP POLICY IF EXISTS "Permitir insert para autenticados" ON public.votos_destaque;
DROP POLICY IF EXISTS "Permitir update para o dono" ON public.votos_destaque;

-- ml_escalacao_padroes: limpar
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ml_escalacao_padroes;

-- ============================================
-- RECRIAR POLÍTICAS ESSENCIAIS SIMPLIFICADAS
-- ============================================

-- profiles: SELECT único
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles
  FOR SELECT USING (true);

-- profiles: INSERT único
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: UPDATE único
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- jogadores: SELECT único
DROP POLICY IF EXISTS "Anyone can view jogadores" ON public.jogadores;
CREATE POLICY "Anyone can view jogadores" ON public.jogadores
  FOR SELECT USING (true);

-- teams: SELECT único
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams" ON public.teams
  FOR SELECT USING (true);

-- teams: INSERT único
DROP POLICY IF EXISTS "Authenticated can create teams" ON public.teams;
CREATE POLICY "Authenticated can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (true);

-- user_roles: SELECT único
DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- votos_destaque: SELECT único
DROP POLICY IF EXISTS "Public can view votos" ON public.votos_destaque;
CREATE POLICY "Public can view votos" ON public.votos_destaque
  FOR SELECT USING (true);

-- votos_destaque: INSERT único
DROP POLICY IF EXISTS "Authenticated can insert votos" ON public.votos_destaque;
CREATE POLICY "Authenticated can insert votos" ON public.votos_destaque
  FOR INSERT TO authenticated WITH CHECK (true);

-- votos_destaque: UPDATE único
DROP POLICY IF EXISTS "Users update own voto" ON public.votos_destaque;
CREATE POLICY "Users update own voto" ON public.votos_destaque
  FOR UPDATE USING (auth.uid() = votante_id);

-- escalacoes: SELECT único
DROP POLICY IF EXISTS "Public can view published escalacoes" ON public.escalacoes;
CREATE POLICY "Public can view published escalacoes" ON public.escalacoes
  FOR SELECT USING (publicada = true);

-- resultados: SELECT único
DROP POLICY IF EXISTS "Public can view resultados" ON public.resultados;
CREATE POLICY "Public can view resultados" ON public.resultados
  FOR SELECT USING (true);

-- estatisticas_partida: SELECT único
DROP POLICY IF EXISTS "Public can view estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Public can view estatisticas" ON public.estatisticas_partida
  FOR SELECT USING (true);

-- jogos: SELECT único
DROP POLICY IF EXISTS "Public can view jogos" ON public.jogos;
CREATE POLICY "Public can view jogos" ON public.jogos
  FOR SELECT USING (true);

-- times: SELECT único
DROP POLICY IF EXISTS "Public can view times" ON public.times;
CREATE POLICY "Public can view times" ON public.times
  FOR SELECT USING (true);

-- notificacoes: SELECT único
DROP POLICY IF EXISTS "Users view own notifications" ON public.notificacoes;
CREATE POLICY "Users view own notifications" ON public.notificacoes
  FOR SELECT USING (user_id = auth.uid());

-- chamados: SELECT único
DROP POLICY IF EXISTS "Users view own chamados" ON public.chamados;
CREATE POLICY "Users view own chamados" ON public.chamados
  FOR SELECT USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- ml_escalacao_padroes: SELECT único
DROP POLICY IF EXISTS "Public can view ml patterns" ON public.ml_escalacao_padroes;
CREATE POLICY "Public can view ml patterns" ON public.ml_escalacao_padroes
  FOR SELECT USING (true);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
