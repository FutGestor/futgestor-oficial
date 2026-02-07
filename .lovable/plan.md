
# Correção: Estatísticas e Presenças — team_id ausente nos INSERTs

## Problema
Os INSERTs nas tabelas `estatisticas_partida` e `confirmacoes_presenca` não incluem `team_id`, violando as políticas RLS que exigem `team_id = get_user_team_id()`.

## Correções

### 1. `src/hooks/useEstatisticas.ts` — useSaveEstatisticasPartida

A mutation precisa receber o `team_id` e incluí-lo em cada registro inserido.

- Adicionar `team_id` ao tipo do parâmetro da mutation
- Incluir `team_id` no payload de cada insert (linha 202-210)

```typescript
// Parâmetro adicional:
team_id: string;

// No insert (linha 202-210), adicionar:
team_id: team_id,
```

### 2. `src/components/EstatisticasPartidaForm.tsx` — handleSave

Passar o `team_id` do perfil do usuário ao chamar a mutation.

- Importar `useAuth`
- Obter `profile` do hook
- Passar `team_id: profile?.team_id` na chamada `saveEstatisticas.mutateAsync()`

### 3. `src/components/AdminPresencaManager.tsx` — handleSave

O INSERT de `confirmacoes_presenca` (linha 70-76) não inclui `team_id`.

- Importar `useAuth`
- Obter `profile` do hook
- Adicionar `team_id: profile?.team_id` ao payload do insert (linha 72-76)

## Resumo

| Arquivo | Mudança |
|---|---|
| `src/hooks/useEstatisticas.ts` | Aceitar e incluir `team_id` no insert |
| `src/components/EstatisticasPartidaForm.tsx` | Passar `team_id` do perfil na mutation |
| `src/components/AdminPresencaManager.tsx` | Incluir `team_id` do perfil no insert |

Três arquivos, mesma correção: adicionar `team_id` aos INSERTs.
