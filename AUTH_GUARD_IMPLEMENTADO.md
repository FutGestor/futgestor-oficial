# ✅ AuthGuard - Proteção de Autenticação Implementada

## Resumo

Implementado sistema global de proteção de autenticação que redireciona automaticamente para `/auth` quando:
- Usuário é deletado (auto-exclusão ou por admin)
- Sessão expira
- Usuário faz logout
- Token é inválido

---

## 🛡️ Componentes Criados

### 1. AuthGuard (`src/components/auth/AuthGuard.tsx`)

**Função:** Monitora o estado de autenticação em tempo real

**Verificações:**
1. **Ao carregar:** Verifica se há sessão válida
2. **onAuthStateChange:** Escuta eventos de login/logout
3. **Polling a cada 30s:** Verifica se o usuário ainda existe no banco

**Redirecionamentos automáticos:**
- Sessão inválida/expirada → `/auth`
- Usuário deletado do banco → `/auth` + toast
- Logout → `/auth`

### 2. Hook useUserExists

**Função:** Verificação contínua se o usuário existe (para detectar exclusão por admin)

**Uso:** Pode ser usado em páginas específicas para verificação mais frequente

---

## 📁 Arquivos Modificados

### App.tsx
- Adicionado `<AuthGuard>` em volta de todas as rotas
- Protege todo o aplicativo de acesso não autenticado

### TeamSelfDelete.tsx
- Após exclusão do time: `signOut()` + redirect `/auth`

### PlayerSelfDelete.tsx  
- Após exclusão da conta: `signOut()` + redirect `/auth`

---

## 🔄 Fluxo de Redirecionamento

### Cenário 1: Auto-exclusão de Time
```
Usuário clica "Excluir Time"
  ↓
RPC delete_own_team executa
  ↓
supabase.auth.signOut()
  ↓
AuthGuard detecta SIGNED_OUT
  ↓
Redirect para /auth
```

### Cenário 2: Auto-exclusão de Conta
```
Usuário clica "Excluir Conta"
  ↓
RPC delete_own_account executa
  ↓
supabase.auth.signOut()
  ↓
AuthGuard detecta SIGNED_OUT
  ↓
Redirect para /auth
```

### Cenário 3: Exclusão por Admin
```
Admin deleta usuário no painel
  ↓
Usuário faz qualquer ação
  ↓
AuthGuard detecta que perfil não existe (polling 30s)
  ↓
supabase.auth.signOut()
  ↓
Redirect para /auth + toast "Conta removida"
```

### Cenário 4: Sessão Expirada
```
Token expira
  ↓
Próxima requisição falha
  ↓
AuthGuard detecta sessão inválida
  ↓
Redirect para /auth
```

---

## ⚙️ Configuração

### Polling de Verificação
- **Intervalo:** 30 segundos (para usuários autenticados)
- **Verificação:** Se o perfil ainda existe no banco
- **Ação se deletado:** Logout + redirect

### Eventos Monitorados
- `SIGNED_IN` - Usuário logou
- `SIGNED_OUT` - Usuário deslogou
- `USER_DELETED` - Usuário deletado
- `TOKEN_REFRESHED` - Token renovado

---

## 📝 Notas

- **Páginas públicas** (`/auth`, `/termos`) não são protegidas
- **Toast notifications** informam o usuário do motivo do redirect
- **LoadingScreen** é mostrado durante verificações
- **Replace** no navigate evita que o usuário volte com "back"
