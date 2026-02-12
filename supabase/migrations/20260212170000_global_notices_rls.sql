-- Enable RLS for Global Notices (where team_id is null)

-- 1. Ensure SuperAdmins can manage all notices
CREATE POLICY "SuperAdmins can manage all avisos"
ON public.avisos
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 2. Update the existing selection policy to include global notices
-- The original policy "Anyone can view published avisos" likely used public.has_role(auth.uid(), 'admin')
-- We need to ensure users can see notices for their team OR global notices (team_id IS NULL)

DROP POLICY IF EXISTS "Anyone can view published avisos" ON public.avisos;

CREATE POLICY "Users can view published global or team avisos"
ON public.avisos
FOR SELECT
USING (
  publicado = true 
  AND (
    team_id IS NULL 
    OR team_id = get_user_team_id() 
    -- If get_user_team_id() is not available or fails, it will still show global ones
  )
);
