

# Corrigir Listagem e Exclusao de Times no Admin

## Problema

A consulta `useTimes()` busca TODOS os times do banco de dados sem filtrar pelo `team_id` do usuario logado. Com a politica publica de leitura adicionada recentemente, agora o admin ve times de todas as contas. Alem disso, ao tentar excluir times de outras contas, o RLS bloqueia a operacao (pois so permite deletar times do proprio team), gerando erro silencioso.

## Solucao

### 1. Filtrar por `team_id` em todas as consultas de times no Admin

**Arquivo: `src/hooks/useTimes.ts`**

Todas as funcoes de consulta (`useTimes`, `useTimesAtivos`, `useTimeCasa`) precisam receber o `team_id` do usuario logado e aplicar `.eq("team_id", teamId)` na query. Isso garante que cada admin so veja os times da sua organizacao.

- `useTimes(teamId)` - adicionar filtro `.eq("team_id", teamId)` e `enabled: !!teamId`
- `useTimesAtivos(teamId)` - idem
- `useTimeCasa(teamId)` - idem

### 2. Atualizar os componentes que usam esses hooks

**Arquivo: `src/pages/admin/AdminTimes.tsx`**

Passar o `team_id` do perfil do usuario (ja disponivel via `useAuth()`) para o hook `useTimes(profile?.team_id)`.

Outros arquivos que importam `useTimes`, `useTimesAtivos` ou `useTimeCasa` tambem precisarao ser atualizados para passar o `team_id`.

### 3. Limpeza de dados orfaos (opcional)

Existem times no banco com `team_id = null` (criados antes do sistema multi-tenant). Esses registros podem ser ignorados pelo filtro ou removidos manualmente via SQL se desejado.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useTimes.ts` | Adicionar parametro `teamId` e filtro `.eq("team_id", teamId)` em todas as queries |
| `src/pages/admin/AdminTimes.tsx` | Passar `profile?.team_id` para `useTimes()` |
| Outros consumidores de `useTimes` | Atualizar chamadas para incluir `teamId` |

