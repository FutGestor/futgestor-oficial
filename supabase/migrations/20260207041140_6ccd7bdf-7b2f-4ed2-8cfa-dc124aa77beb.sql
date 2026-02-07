
DROP POLICY IF EXISTS "Members can view own team" ON public.teams;
CREATE POLICY "Members can view own team"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id = get_user_team_id()
    OR get_user_team_id() IS NULL
  );
