
-- Drop restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can create team" ON public.teams;
CREATE POLICY "Authenticated users can create team"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Drop restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Members can view own team" ON public.teams;
CREATE POLICY "Members can view own team"
  ON public.teams FOR SELECT
  TO authenticated
  USING (id = get_user_team_id());

-- Drop restrictive UPDATE policy and recreate as permissive
DROP POLICY IF EXISTS "Team admins can update own team" ON public.teams;
CREATE POLICY "Team admins can update own team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (is_team_admin(auth.uid(), id));

-- Also fix profiles UPDATE policy to be permissive (needed during onboarding)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Fix user_roles INSERT - need permissive policy for onboarding self-assignment
DROP POLICY IF EXISTS "Team admins can manage roles" ON public.user_roles;
CREATE POLICY "Team admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Users can insert own admin role for new team"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix times INSERT for onboarding
DROP POLICY IF EXISTS "Team admins can manage times" ON public.times;
CREATE POLICY "Team admins can manage times"
  ON public.times FOR ALL
  TO authenticated
  USING (is_team_admin(auth.uid(), team_id));
