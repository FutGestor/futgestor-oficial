# ✅ Auto-Exclusão Implementada

## Resumo

Implementada a funcionalidade de auto-exclusão para times e jogadores, com as devidas restrições de segurança.

---

## 🎯 Funcionalidades

### 1. Auto-Exclusão de Time (TeamSelfDelete)

**Local:** Perfil público do time (`/explorar/time/:slug`)

**Quem pode usar:**
- ✅ Membros do time que são admins
- ❌ God Admin (futgestor@gmail.com) - não pode se auto-excluir
- ❌ Usuários de outros times

**Como funciona:**
1. Botão "Excluir Time Permanentemente" aparece apenas para admins do próprio time
2. Modal de confirmação com digitação do nome do time
3. Chama RPC `delete_own_team`
4. Redireciona para home após exclusão

**Arquivos:**
- `src/components/team/TeamSelfDelete.tsx`
- Modificado: `src/pages/TeamProfile.tsx`

---

### 2. Auto-Exclusão de Jogador (PlayerSelfDelete)

**Local:** Aba "Segurança" no perfil do jogador (`/meu-perfil`)

**Quem pode usar:**
- ✅ Jogadores comuns (não admins)
- ❌ God Admin - não pode se auto-excluir
- ❌ Admins de time - devem usar o painel God

**Como funciona:**
1. Botão "Excluir Minha Conta Permanentemente" na aba de Segurança
2. Modal com confirmação por digitação do nome
3. Avisos sobre perda de dados (estatísticas, presenças)
4. Chama RPC `delete_own_account`
5. Redireciona para home após exclusão

**Arquivos:**
- `src/components/player/PlayerSelfDelete.tsx`
- Modificado: `src/components/profile/SecurityForm.tsx`
- Modificado: `src/pages/MeuPerfil.tsx`

---

## 🗄️ Funções RPC Criadas

### `delete_own_team(_team_id UUID)`
Já existia, mas foi atualizada para remover referências a tabelas inexistentes.

### `delete_own_account()` (NOVA)
```sql
-- Permite que jogadores (não-admins) excluam suas contas
-- Restrições:
--   - Não funciona para God Admin
--   - Não funciona para admins de time
--   - Remove: perfil, jogadores, presenças, conquistas, etc.
```

**Arquivo:** `supabase/migrations/20250221120000_add_player_self_delete.sql`

---

## 🔒 Restrições de Segurança

| Tipo de Usuário | Excluir Time | Excluir Conta | Via |
|-----------------|--------------|---------------|-----|
| God Admin | ❌ Não | ❌ Não | Painel God Admin |
| Admin de Time | ✅ Sim | ❌ Não | Perfil do Time |
| Jogador Comum | ❌ Não | ✅ Sim | Aba Segurança |

---

## 📝 Passos para Deploy

1. **Executar migração SQL:**
   ```sql
   -- Arquivo: supabase/migrations/20250221120000_add_player_self_delete.sql
   ```

2. **Verificar permissões:**
   ```sql
   GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
   ```

3. **Testar:**
   - Criar um jogador comum (não admin)
   - Tentar excluir conta via aba Segurança
   - Verificar se dados foram removidos

---

## ⚠️ Notas Importantes

- **God Admin nunca pode se auto-excluir** - proteção contra perda de acesso total
- **Admins devem usar o painel God** para excluir outros admins
- **Confirmação por digitação** do nome evita exclusões acidentais
- **Cache é limpo** após exclusão (queryClient.clear())
