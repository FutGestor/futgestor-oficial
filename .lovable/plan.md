

# Correção Urgente: Novos Usuários Virando Admin

## Problema

O fluxo atual redireciona **todos** os usuários sem `team_id` para o `/onboarding`, onde eles criam um novo time e se tornam admin automaticamente. Isso significa que qualquer pessoa que se cadastra ganha acesso admin ao seu próprio time, em vez de aguardar aprovacao para entrar no time existente.

## Causa Raiz

No `Auth.tsx`, linha 138:
```
if (!profile?.team_id) → navigate("/onboarding")
```

Isso envia tanto criadores de time quanto membros comuns para a mesma tela de criacao de time.

## Solucao

### 1. Mudar o fluxo de login para membros comuns

Em vez de redirecionar para `/onboarding`, usuarios sem `team_id` devem ver uma tela de "aguardando aprovacao" (o admin vincula o usuario ao time manualmente). O onboarding so deve ser acessivel quando o usuario realmente precisa criar um time novo.

**Arquivo: `src/pages/Auth.tsx`**
- Remover o redirect automatico para `/onboarding` quando `!profile?.team_id`
- Se o usuario nao tem `team_id` E nao esta aprovado: mostrar mensagem "Aguardando aprovacao"
- Se o usuario nao tem `team_id` MAS esta aprovado: isso nao deveria acontecer, tratar como erro

### 2. Proteger a rota `/onboarding`

**Arquivo: `src/pages/Onboarding.tsx`**
- Adicionar verificacao: so permitir acesso ao onboarding se o usuario nao tem time E nao existe nenhum time no sistema para ele se juntar (ou via um parametro explicito)
- Alternativa mais simples: remover o redirect automatico e tornar o onboarding acessivel apenas por link direto ou botao especifico

### 3. Admin vincula usuario ao time

**Arquivo: `src/pages/admin/AdminUsuarios.tsx`**
- Quando o admin aprova um usuario pendente, tambem definir o `team_id` do profile para o time do admin
- Atualmente o `handleApprove` so muda `aprovado: true`, mas NAO define o `team_id`

## Detalhes Tecnicos

### Auth.tsx - Novo fluxo de login (linhas 137-162)
```typescript
// Sem team → aguardando vinculação por admin
if (!profile?.team_id) {
  toast({
    title: "Aguardando aprovação",
    description: "Sua conta ainda não foi vinculada a um time. Aguarde a aprovação de um administrador.",
  });
  await supabase.auth.signOut();
  return;
}

// Com team, é admin → admin panel  
if (adminRole) {
  navigate("/admin");
}
// Com team, aprovado → site normal
else if (profile?.aprovado) {
  navigate("/");
}
// Com team, não aprovado → aguardando
else {
  toast({ title: "Aguardando aprovação", ... });
  await supabase.auth.signOut();
}
```

### AdminUsuarios.tsx - Aprovar com team_id
```typescript
const handleApprove = async (profileId: string) => {
  // Buscar o team_id do admin atual
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ aprovado: true, team_id: adminProfile?.team_id })
    .eq("id", profileId);
};
```

### Onboarding.tsx - Proteger acesso
- Manter a pagina, mas nao redirecionar automaticamente para ela
- Sera usada apenas para criar times novos (acesso futuro via link ou funcionalidade especifica)

## Resumo das Mudancas

1. **Auth.tsx**: Remover redirect para `/onboarding`; usuarios sem time fazem sign out com mensagem
2. **AdminUsuarios.tsx**: Ao aprovar, tambem definir o `team_id` do usuario para o time do admin
3. **Onboarding.tsx**: Nenhuma mudanca estrutural, mas nao sera mais acessado automaticamente

