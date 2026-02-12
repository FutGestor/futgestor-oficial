-- Secure function to get profiles with emails AND subscription info
-- Uses a new name to avoid conflicts with previous attempts
CREATE OR REPLACE FUNCTION public.get_admin_users_full()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  jogador_id UUID,
  aprovado BOOLEAN,
  created_at TIMESTAMPTZ,
  team_id UUID,
  email TEXT,
  plano TEXT,
  status_plano TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_team_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Determine the highest privilege role for this user
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    v_user_role := 'super_admin';
  ELSIF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    v_user_role := 'admin';
  ELSE
    RAISE EXCEPTION 'Access denied. User must be an admin or super_admin.';
  END IF;

  -- 2. Get team_id
  SELECT team_id INTO v_user_team_id FROM public.profiles WHERE id = auth.uid();

  -- 3. Execute logic based on determined role
  IF v_user_role = 'super_admin' THEN
    -- Super Admin sees ALL profiles
    RETURN QUERY 
    SELECT 
      p.id, 
      p.nome, 
      p.jogador_id, 
      p.aprovado, 
      p.created_at, 
      p.team_id, 
      u.email::TEXT,
      s.plano::TEXT,
      s.status::TEXT
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.subscriptions s ON p.team_id = s.team_id
    ORDER BY p.created_at DESC;
    
  ELSIF v_user_role = 'admin' THEN
    -- Admin sees profiles from their TEAM + ORPHANS (no team)
    RETURN QUERY 
    SELECT 
      p.id, 
      p.nome, 
      p.jogador_id, 
      p.aprovado, 
      p.created_at, 
      p.team_id, 
      u.email::TEXT,
      s.plano::TEXT,
      s.status::TEXT
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.subscriptions s ON p.team_id = s.team_id
    WHERE (p.team_id = v_user_team_id OR p.team_id IS NULL)
    ORDER BY p.created_at DESC;
  END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_users_full() TO authenticated;
