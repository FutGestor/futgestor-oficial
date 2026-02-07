
# Corrigir Isolamento de Usuarios por Time + Super Admin

## Problema
Atualmente, qualquer admin de qualquer time consegue ver TODOS os usuarios do sistema. Isso acontece por dois motivos:
1. A policy RLS "Admins can manage all profiles" usa `has_role(auth.uid(), 'admin')` que da acesso a QUALQUER admin
2. A query no `AdminUsuarios.tsx` nao filtra por `team_id`

## Solucao

### 1. Criar role "super_admin" no banco de dados
- Adicionar `'super_admin'` ao enum `app_role`
- Atribuir role `super_admin` a conta `futgestor@gmail.com` (ID: `6dcc735a-95a8-498a-bc21-2a94cdb0a893`)
- Criar funcao `is_super_admin()` para verificar essa role

### 2. Corrigir RLS da tabela `profiles`
- Alterar policy "Admins can manage all profiles" para:
  - Super admin: acesso total a todos os profiles
  - Admin de time: acesso apenas aos profiles do mesmo `team_id`

Nova policy:
```text
USING (
  is_super_admin(auth.uid()) 
  OR is_team_admin(auth.uid(), team_id)
)
```

### 3. Corrigir a query no `AdminUsuarios.tsx`
- Para admins normais: filtrar profiles por `team_id` do admin logado
- Para super admin (futgestor@gmail.com): mostrar todos os profiles
- Adicionar flag no `useAuth` ou verificar diretamente se o usuario tem role `super_admin`

### 4. Atualizar `useAuth` para detectar super admin
- Adicionar campo `isSuperAdmin` ao contexto de autenticacao
- Verificar na tabela `user_roles` se tem role `super_admin`

### 5. Ajustar a interface do `AdminUsuarios`
- Super admin vera todos os usuarios de todos os times, com indicacao do time de cada um
- Admin normal vera apenas usuarios do seu proprio time

## Detalhes Tecnicos

### Migracao SQL
```text
-- Adicionar super_admin ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Criar funcao helper
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

-- Atribuir role ao futgestor
INSERT INTO public.user_roles (user_id, role)
VALUES ('6dcc735a-95a8-498a-bc21-2a94cdb0a893', 'super_admin')
ON CONFLICT DO NOTHING;

-- Corrigir RLS policy de profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  is_super_admin(auth.uid())
  OR is_team_admin(auth.uid(), team_id)
);
```

### Arquivos a modificar
- `src/hooks/useAuth.tsx` - Adicionar `isSuperAdmin` ao contexto
- `src/pages/admin/AdminUsuarios.tsx` - Filtrar por `team_id` para admins normais; mostrar todos para super admin
- Migracao SQL para enum, funcao e policies
