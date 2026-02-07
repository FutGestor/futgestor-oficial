

# Mostrar card "Agendar Partida" para visitantes na pagina publica do time

## Problema atual

O card "Quer jogar contra a gente?" (ScheduleGameCard) so aparece para membros logados do time, pois esta dentro do bloco `{isMember && (...)}`. Visitantes nao logados veem apenas o hero com o botao "Entrar" e nada mais.

## Solucao

Mover o `ScheduleGameCard` para fora do bloco condicional `isMember`, de modo que ele apareca sempre — tanto para visitantes quanto para membros. O card ficara logo abaixo do hero section, visivel para todos.

## Detalhes tecnicos

### Arquivo: `src/pages/TeamPublicPage.tsx`

- Extrair a section do `ScheduleGameCard` para fora do `{isMember && (...)}` e coloca-la entre o hero e o bloco condicional dos cards de membros
- Estrutura resultante:
  1. Hero section (sempre visivel)
  2. ScheduleGameCard section (sempre visivel - para visitantes e membros)
  3. Cards de membros (apenas para membros logados)

### Arquivo: `src/components/ScheduleGameCard.tsx` e `src/hooks/useSolicitacoes.ts`

- Verificar se o hook `useCreateSolicitacao` e a tabela `solicitacoes_jogos` permitem insercao sem autenticacao (visitante anonimo)
- Caso a tabela tenha RLS restritiva, sera necessario adicionar uma policy de INSERT para `anon` role, ja que visitantes nao estarao logados

### Verificacao de RLS necessaria

- Consultar as policies da tabela `solicitacoes_jogos` para garantir que visitantes possam enviar solicitacoes
- Se necessario, criar migration com policy de INSERT para role `anon`

