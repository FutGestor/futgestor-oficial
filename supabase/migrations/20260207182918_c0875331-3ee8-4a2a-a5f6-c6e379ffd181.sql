
-- Criar/atualizar funcao helper para verificar super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Atribuir role super_admin ao futgestor@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('6dcc735a-95a8-498a-bc21-2a94cdb0a893', 'super_admin');

-- Corrigir RLS policy de profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  is_super_admin(auth.uid())
  OR is_team_admin(auth.uid(), team_id)
);
