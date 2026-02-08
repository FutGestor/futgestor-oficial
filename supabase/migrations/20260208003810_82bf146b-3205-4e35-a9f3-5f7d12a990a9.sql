
-- =============================================
-- LEAGUE MANAGER: 3 new tables
-- =============================================

-- 1. leagues
CREATE TABLE public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leagues_team_id ON public.leagues(team_id);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- Public can read leagues
CREATE POLICY "Public can view leagues"
  ON public.leagues FOR SELECT
  USING (true);

-- Team admins can manage their leagues
CREATE POLICY "Team admins can manage leagues"
  ON public.leagues FOR ALL
  USING (is_team_admin(auth.uid(), team_id));

-- Trigger updated_at
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. league_teams
CREATE TABLE public.league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_teams_league_id ON public.league_teams(league_id);

ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;

-- Public can read league_teams
CREATE POLICY "Public can view league_teams"
  ON public.league_teams FOR SELECT
  USING (true);

-- Team admins (via league join) can manage
CREATE POLICY "Team admins can manage league_teams"
  ON public.league_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_teams.league_id
        AND is_team_admin(auth.uid(), l.team_id)
    )
  );

-- 3. league_matches
CREATE TABLE public.league_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  round integer NOT NULL DEFAULT 1,
  team_home_id uuid NOT NULL REFERENCES public.league_teams(id) ON DELETE CASCADE,
  team_away_id uuid NOT NULL REFERENCES public.league_teams(id) ON DELETE CASCADE,
  score_home integer,
  score_away integer,
  status text NOT NULL DEFAULT 'agendado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_matches_league_id ON public.league_matches(league_id);

ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;

-- Public can read league_matches
CREATE POLICY "Public can view league_matches"
  ON public.league_matches FOR SELECT
  USING (true);

-- Team admins (via league join) can manage
CREATE POLICY "Team admins can manage league_matches"
  ON public.league_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_matches.league_id
        AND is_team_admin(auth.uid(), l.team_id)
    )
  );

-- Trigger updated_at
CREATE TRIGGER update_league_matches_updated_at
  BEFORE UPDATE ON public.league_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
