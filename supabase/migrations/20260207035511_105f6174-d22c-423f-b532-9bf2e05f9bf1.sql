
-- 1. Criar tabela teams (organização/conta)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  escudo_url TEXT,
  plano TEXT NOT NULL DEFAULT 'basico',
  cores JSONB DEFAULT '{}'::jsonb,
  redes_sociais JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Trigger de updated_at para teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Adicionar team_id em TODAS as tabelas existentes (nullable para migração)
ALTER TABLE public.profiles ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.jogadores ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.jogos ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.times ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.transacoes ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.resultados ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.escalacoes ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.avisos ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.solicitacoes_jogo ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.confirmacoes_presenca ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.estatisticas_partida ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.votos_destaque ADD COLUMN team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.user_roles ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- 3. Índices para performance de queries filtradas por team_id
CREATE INDEX idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX idx_jogadores_team_id ON public.jogadores(team_id);
CREATE INDEX idx_jogos_team_id ON public.jogos(team_id);
CREATE INDEX idx_times_team_id ON public.times(team_id);
CREATE INDEX idx_transacoes_team_id ON public.transacoes(team_id);
CREATE INDEX idx_resultados_team_id ON public.resultados(team_id);
CREATE INDEX idx_escalacoes_team_id ON public.escalacoes(team_id);
CREATE INDEX idx_avisos_team_id ON public.avisos(team_id);
CREATE INDEX idx_solicitacoes_team_id ON public.solicitacoes_jogo(team_id);
CREATE INDEX idx_confirmacoes_team_id ON public.confirmacoes_presenca(team_id);
CREATE INDEX idx_estatisticas_team_id ON public.estatisticas_partida(team_id);
CREATE INDEX idx_votos_team_id ON public.votos_destaque(team_id);
CREATE INDEX idx_user_roles_team_id ON public.user_roles(team_id);

-- 4. Função auxiliar: buscar team_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 5. Função auxiliar: checar se user é admin do team
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND team_id = _team_id
  )
$$;

-- 6. RLS para teams
CREATE POLICY "Members can view own team"
  ON public.teams FOR SELECT
  USING (id = public.get_user_team_id());

CREATE POLICY "Team admins can update own team"
  ON public.teams FOR UPDATE
  USING (public.is_team_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create team"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Atualizar RLS em TODAS as tabelas para filtrar por team_id
-- Nota: mantemos as policies existentes que já funcionam e adicionamos filtro team_id

-- profiles: atualizar policies existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    public.is_team_admin(auth.uid(), team_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- jogadores: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view jogadores" ON public.jogadores;
CREATE POLICY "Team members can view jogadores"
  ON public.jogadores FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage jogadores" ON public.jogadores;
CREATE POLICY "Team admins can manage jogadores"
  ON public.jogadores FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Users can insert own jogador" ON public.jogadores;
CREATE POLICY "Users can insert own jogador"
  ON public.jogadores FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND team_id = public.get_user_team_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND aprovado = true)
  );

DROP POLICY IF EXISTS "Users can update own jogador" ON public.jogadores;
CREATE POLICY "Users can update own jogador"
  ON public.jogadores FOR UPDATE
  USING (
    user_id = auth.uid()
    OR id IN (SELECT jogador_id FROM profiles WHERE id = auth.uid())
  );

-- jogos: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view jogos" ON public.jogos;
CREATE POLICY "Team members can view jogos"
  ON public.jogos FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage jogos" ON public.jogos;
CREATE POLICY "Team admins can manage jogos"
  ON public.jogos FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- times: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view active times" ON public.times;
CREATE POLICY "Team members can view times"
  ON public.times FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage times" ON public.times;
CREATE POLICY "Team admins can manage times"
  ON public.times FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- transacoes: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes;
CREATE POLICY "Team members can view transacoes"
  ON public.transacoes FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage transacoes" ON public.transacoes;
CREATE POLICY "Team admins can manage transacoes"
  ON public.transacoes FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- resultados: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view resultados" ON public.resultados;
CREATE POLICY "Team members can view resultados"
  ON public.resultados FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage resultados" ON public.resultados;
CREATE POLICY "Team admins can manage resultados"
  ON public.resultados FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- escalacoes: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view published escalacoes" ON public.escalacoes;
CREATE POLICY "Team members can view published escalacoes"
  ON public.escalacoes FOR SELECT
  USING (
    (team_id = public.get_user_team_id() OR team_id IS NULL)
    AND (publicada = true OR public.is_team_admin(auth.uid(), team_id))
  );

DROP POLICY IF EXISTS "Admins can manage escalacoes" ON public.escalacoes;
CREATE POLICY "Team admins can manage escalacoes"
  ON public.escalacoes FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- avisos: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view published avisos" ON public.avisos;
CREATE POLICY "Team members can view published avisos"
  ON public.avisos FOR SELECT
  USING (
    (team_id = public.get_user_team_id() OR team_id IS NULL)
    AND (publicado = true OR public.is_team_admin(auth.uid(), team_id))
  );

DROP POLICY IF EXISTS "Admins can manage avisos" ON public.avisos;
CREATE POLICY "Team admins can manage avisos"
  ON public.avisos FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- solicitacoes_jogo: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can create solicitacao" ON public.solicitacoes_jogo;
CREATE POLICY "Anyone can create solicitacao"
  ON public.solicitacoes_jogo FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can view solicitacoes"
  ON public.solicitacoes_jogo FOR SELECT
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Admins can update solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can update solicitacoes"
  ON public.solicitacoes_jogo FOR UPDATE
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Admins can delete solicitacoes" ON public.solicitacoes_jogo;
CREATE POLICY "Team admins can delete solicitacoes"
  ON public.solicitacoes_jogo FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

-- confirmacoes_presenca: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view confirmacoes" ON public.confirmacoes_presenca;
CREATE POLICY "Team members can view confirmacoes"
  ON public.confirmacoes_presenca FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can delete confirmacoes" ON public.confirmacoes_presenca;
CREATE POLICY "Team admins can delete confirmacoes"
  ON public.confirmacoes_presenca FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Approved users can insert own confirmacao" ON public.confirmacoes_presenca;
CREATE POLICY "Approved users can insert own confirmacao"
  ON public.confirmacoes_presenca FOR INSERT
  WITH CHECK (
    public.is_team_admin(auth.uid(), team_id)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.aprovado = true
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

DROP POLICY IF EXISTS "Users can update own confirmacao or admin" ON public.confirmacoes_presenca;
CREATE POLICY "Users can update own confirmacao or admin"
  ON public.confirmacoes_presenca FOR UPDATE
  USING (
    public.is_team_admin(auth.uid(), team_id)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  );

-- estatisticas_partida: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team members can view estatisticas"
  ON public.estatisticas_partida FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage estatisticas" ON public.estatisticas_partida;
CREATE POLICY "Team admins can manage estatisticas"
  ON public.estatisticas_partida FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- votos_destaque: filtrar por team_id
DROP POLICY IF EXISTS "Anyone can view votos" ON public.votos_destaque;
CREATE POLICY "Team members can view votos"
  ON public.votos_destaque FOR SELECT
  USING (team_id = public.get_user_team_id() OR team_id IS NULL);

DROP POLICY IF EXISTS "Admins can delete votos" ON public.votos_destaque;
CREATE POLICY "Team admins can delete votos"
  ON public.votos_destaque FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Approved users can vote" ON public.votos_destaque;
CREATE POLICY "Approved users can vote"
  ON public.votos_destaque FOR INSERT
  WITH CHECK (
    auth.uid() = votante_id
    AND team_id = public.get_user_team_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND aprovado = true)
  );

DROP POLICY IF EXISTS "Users can update own vote" ON public.votos_destaque;
CREATE POLICY "Users can update own vote"
  ON public.votos_destaque FOR UPDATE
  USING (auth.uid() = votante_id AND team_id = public.get_user_team_id());

-- user_roles: atualizar policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Team admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- escalacao_jogadores: filtrar por team_id (via escalacao)
DROP POLICY IF EXISTS "Anyone can view escalacao_jogadores" ON public.escalacao_jogadores;
CREATE POLICY "Team members can view escalacao_jogadores"
  ON public.escalacao_jogadores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM escalacoes e
      WHERE e.id = escalacao_jogadores.escalacao_id
        AND (e.team_id = public.get_user_team_id() OR e.team_id IS NULL)
        AND (e.publicada = true OR public.is_team_admin(auth.uid(), e.team_id))
    )
  );

DROP POLICY IF EXISTS "Admins can manage escalacao_jogadores" ON public.escalacao_jogadores;
CREATE POLICY "Team admins can manage escalacao_jogadores"
  ON public.escalacao_jogadores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM escalacoes e
      WHERE e.id = escalacao_jogadores.escalacao_id
        AND public.is_team_admin(auth.uid(), e.team_id)
    )
  );
