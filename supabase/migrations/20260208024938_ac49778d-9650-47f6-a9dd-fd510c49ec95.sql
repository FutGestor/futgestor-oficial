-- Add PERMISSIVE policy so super_admin can read ALL teams
CREATE POLICY "Super admins can view all teams"
ON public.teams
FOR SELECT
USING (is_super_admin(auth.uid()));