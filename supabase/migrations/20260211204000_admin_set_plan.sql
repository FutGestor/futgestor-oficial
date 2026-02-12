-- 1. Atualizar RPC de Usuários (Restrição SaaS)
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
SET search_path = public, auth
AS $$
DECLARE
  v_is_super BOOLEAN;
  v_is_admin BOOLEAN;
  v_user_team_id UUID;
BEGIN
  v_is_super := COALESCE(public.is_super_admin(auth.uid()), false);
  v_is_admin := COALESCE(public.has_role(auth.uid(), 'admin'), false);

  IF NOT (v_is_super OR v_is_admin) THEN
    RETURN;
  END IF;

  SELECT p.team_id INTO v_user_team_id FROM public.profiles p WHERE p.id = auth.uid();

  RETURN QUERY 
  SELECT 
    p.id, p.nome, p.jogador_id, p.aprovado, p.created_at, p.team_id, 
    u.email::TEXT,
    s.plano::TEXT,
    s.status::TEXT
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.subscriptions s ON p.team_id = s.team_id
  WHERE 
    (v_is_super = true) -- Super Admin vê leads e outros times
    OR 
    (v_is_admin = true AND p.team_id = v_user_team_id) -- Admin só vê seu time
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. RPC para Mudança de Plano (Apenas Super Admin)
CREATE OR REPLACE FUNCTION public.admin_set_plan(_team_id UUID, _plan_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.is_super_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas o Super Admin gerencia planos.';
  END IF;

  INSERT INTO public.subscriptions (team_id, plano, status, expires_at)
  VALUES (_team_id, _plan_type, 'active', now() + interval '100 years')
  ON CONFLICT (team_id) DO UPDATE
  SET 
    plano = EXCLUDED.plano,
    status = 'active',
    expires_at = now() + interval '100 years',
    updated_at = now();
END;
$$;

-- 3. NOVA RPC: Exclusão Permanente de Usuário (Apenas Super Admin)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Segurança: Somente Super Admin deleta contas
  IF NOT COALESCE(public.is_super_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas o Super Admin pode excluir contas permanentemente.';
  END IF;

  -- Impede o super admin de se auto-deletar por acidente
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operação cancelada. Você não pode excluir sua própria conta super admin.';
  END IF;

  -- Deleta da tabela auth.users (isso dispara o cascade para perfis e roles)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_full() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
