

# Vincular solicitacoes de jogo ao time correto

## Problema

Quando um visitante envia uma solicitacao de partida pela pagina publica (`/time/demo-fc`), o campo `team_id` nao e preenchido no registro. Como a politica de seguranca dos admins filtra por `team_id`, as solicitacoes nunca aparecem para nenhum admin.

## Solucao

Passar o `team_id` do contexto da pagina publica ate o hook de criacao da solicitacao, garantindo que cada solicitacao fique vinculada ao time correto.

## Detalhes tecnicos

### 1. Componente `ScheduleGameCard` (src/components/ScheduleGameCard.tsx)

- Adicionar prop `teamId?: string`
- Passar `teamId` para o `SolicitacaoJogoForm`

### 2. Componente `SolicitacaoJogoForm` (src/components/SolicitacaoJogoForm.tsx)

- Adicionar prop `teamId?: string`
- Passar `teamId` ao chamar `createSolicitacao.mutateAsync()`

### 3. Hook `useCreateSolicitacao` (src/hooks/useSolicitacoes.ts)

- Adicionar campo `team_id` ao tipo de dados do `mutationFn`
- Incluir `team_id` no insert para a tabela `solicitacoes_jogo`

### 4. Pagina `TeamPublicPage` (src/pages/TeamPublicPage.tsx)

- Passar `teamId={team.id}` ao renderizar `<ScheduleGameCard>`

### Fluxo corrigido

1. Visitante acessa `/time/demo-fc`
2. `TeamPublicPage` obtem o `team.id` via `useTeamConfig()`
3. Passa `team.id` para `ScheduleGameCard` -> `SolicitacaoJogoForm` -> `useCreateSolicitacao`
4. O INSERT inclui `team_id`, vinculando a solicitacao ao time
5. Admin do time ve a solicitacao na area administrativa

### Arquivos modificados
- `src/pages/TeamPublicPage.tsx` (passa teamId ao ScheduleGameCard)
- `src/components/ScheduleGameCard.tsx` (recebe e repassa teamId)
- `src/components/SolicitacaoJogoForm.tsx` (recebe e usa teamId)
- `src/hooks/useSolicitacoes.ts` (inclui team_id no insert)

