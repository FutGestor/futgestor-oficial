

# Diagnóstico e Correção: Problemas Graves no Fluxo de Onboarding

## O que aconteceu

### Problema 1: Usuário futgestor@gmail.com vendo tela de onboarding
O login verifica `if (!profile?.team_id)` e redireciona para `/onboarding`. O admin original (futgestor@gmail.com) tem `team_id` no perfil, MAS seu registro na tabela `user_roles` tem `team_id: NULL` (foi criado antes da migração multi-tenancy). Como o `Admin.tsx` usa `is_team_admin()` que exige match de `team_id`, o admin foi considerado "não admin" e algo no fluxo o redirecionou ao onboarding.

### Problema 2: Erro "duplicate key violates unique constraint user_roles_user_id_role_key"
O admin já tem um registro `(user_id, role=admin)` na tabela `user_roles`. Ao tentar criar outro time no onboarding, o step 3 tenta inserir outro registro com o mesmo `user_id + role`, violando a constraint unique.

### Problema 3: Usuário de teste acessou dados do admin
A política SELECT com `get_user_team_id() IS NULL` permite que qualquer usuário sem time veja TODOS os times. Combinado com o `Admin.tsx` que verifica admin sem escopo de team, o teste pode ter visto dados de outro time.

## Correções Necessárias

### 1. Correção de dados (migração SQL)
- Atualizar o `user_roles` do admin original para incluir o `team_id` correto
- Limpar dados duplicados/órfãos do time de teste se necessário

```sql
-- Corrigir user_roles do admin original que tem team_id NULL
UPDATE public.user_roles 
SET team_id = (SELECT team_id FROM public.profiles WHERE id = user_roles.user_id)
WHERE team_id IS NULL AND role = 'admin';

-- Remover o time de teste e dados associados se desejado
```

### 2. Proteção no Onboarding (código)
- Adicionar redirect no `Onboarding.tsx`: se o usuário JÁ tem `team_id`, redirecionar para `/admin` ou `/` em vez de permitir criar outro time
- Usar `useAuth()` para verificar `profile?.team_id` e fazer redirect

### 3. Usar UPSERT em vez de INSERT para user_roles (código)
- No `Onboarding.tsx`, trocar o `.insert()` do step 3 por `.upsert()` para evitar o erro de constraint unique, ou verificar se já existe antes de inserir

### 4. Restringir política SELECT do teams (migração SQL)
- A política `get_user_team_id() IS NULL` é necessária durante onboarding mas muito permissiva
- Não é um risco grave pois só expõe nomes de times, mas pode ser refinada futuramente

## Detalhes Técnicos

### Migração SQL
```sql
-- Fix: user_roles sem team_id
UPDATE public.user_roles 
SET team_id = (SELECT team_id FROM public.profiles WHERE id = user_roles.user_id)
WHERE team_id IS NULL;
```

### Onboarding.tsx - Adicionar guard
```typescript
const { user, profile, refreshProfile } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (profile?.team_id) {
    navigate("/admin");
  }
}, [profile, navigate]);
```

### Onboarding.tsx - Usar upsert no step 3
```typescript
// Step 3: usar upsert para evitar erro de duplicate key
const { error: roleError } = await supabase
  .from("user_roles")
  .upsert(
    { user_id: user.id, role: "admin", team_id: team.id },
    { onConflict: "user_id,role" }
  );
```

## Resumo das mudanças
1. **Migração SQL**: corrigir `user_roles` com `team_id` NULL
2. **Onboarding.tsx**: adicionar guard para usuários que já tem time + usar upsert no user_roles
3. Nenhuma mudança no Auth.tsx ou Admin.tsx necessária

