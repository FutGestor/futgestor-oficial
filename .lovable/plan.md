
# Limpeza e Ajustes do Sistema

## Resumo
Remover funcionalidades duplicadas/desnecessarias, tornar paginas publicas, adicionar campo MVP no admin, e corrigir erro 404 quando deslogado.

## 1. Remover confirmacao de presenca da pagina inicial (TeamPublicPage)

No componente `NextGameCard` em `src/pages/TeamPublicPage.tsx`, remover o bloco de "Confirme sua presenca" (linhas 87-111) com os botoes "Vou jogar" e "Nao posso". Remover imports relacionados (`useConfirmacoesJogo`, `useConfirmarPresenca`).

## 2. Remover confirmacao de presenca da Agenda

Em `src/pages/Agenda.tsx`, remover o componente `ConfirmacaoPresenca` do `GameCard` (linhas 73-78). Remover import do `ConfirmacaoPresenca` e do `useAuth` (se nao for mais necessario). Remover a prop `showPresenca` do jogo.

## 3. Remover votacao de destaque (MVP) da pagina de Resultados

Em `src/pages/Resultados.tsx`, remover o componente `VotacaoDestaque` da listagem de resultados (linha 197). Remover imports do `VotacaoDestaque` e `useAuth` (se nao usado para outra coisa).

## 4. Adicionar campo MVP no formulario de Estatisticas (Admin)

### 4.1 Banco de dados
Adicionar coluna `mvp_jogador_id` (uuid, nullable, FK para jogadores) na tabela `resultados`.

### 4.2 Formulario de Estatisticas
Em `src/components/EstatisticasPartidaForm.tsx`, adicionar um `Select` para o admin escolher o MVP da partida entre os jogadores que participaram. Ao salvar estatisticas, tambem salvar o `mvp_jogador_id` no resultado.

### 4.3 Ranking de Destaques
Atualizar `useRankingDestaques` em `src/hooks/useEstatisticas.ts` para contar MVPs a partir da coluna `resultados.mvp_jogador_id` ao inves dos votos da tabela `votos_destaque`.

## 5. Tornar Escalacao e Ranking publicos (visiveis sem login)

### 5.1 Escalacao
Em `src/pages/Escalacao.tsx`, remover o wrapper `RequireTeam` para que a pagina seja acessivel sem login.

### 5.2 Ranking
Em `src/pages/Ranking.tsx`, remover o wrapper `RequireTeam` para que a pagina seja acessivel sem login.

### 5.3 Navegacao (Header)
Em `src/components/layout/Header.tsx`, mover "Escalacao" e "Ranking" dos `memberNavItems` para os `visitorNavItems`, tornando-os visiveis no menu para todos.

## 6. Corrigir erro 404 quando deslogado

O problema e que quando o usuario desloga, a pagina do time (`/time/adminfc/resultados`) tenta renderizar mas o `TeamSlugLayout` funciona normalmente (busca o time pelo slug). O problema provavel esta nos componentes internos que dependem de autenticacao.

A causa raiz e que paginas como Resultados, Agenda, etc, dentro do layout do time, devem funcionar normalmente sem login (sao publicas), mas podem estar falhando por causa de queries que dependem de `team_id` do perfil do usuario.

Vou investigar e garantir que:
- O `TeamSlugLayout` continua funcionando para visitantes (ja funciona).
- As paginas publicas (Resultados, Agenda, Escalacao, Ranking) nao quebrem sem usuario logado.
- Se houver redirecionamento indevido ao deslogar, corrigir o fluxo.

## Detalhes Tecnicos

### Migracao SQL
```text
ALTER TABLE public.resultados 
ADD COLUMN mvp_jogador_id uuid REFERENCES public.jogadores(id) ON DELETE SET NULL;
```

### Arquivos a modificar
- `src/pages/TeamPublicPage.tsx` -- Remover confirmacao de presenca do NextGameCard
- `src/pages/Agenda.tsx` -- Remover ConfirmacaoPresenca do GameCard
- `src/pages/Resultados.tsx` -- Remover VotacaoDestaque
- `src/pages/Escalacao.tsx` -- Remover RequireTeam
- `src/pages/Ranking.tsx` -- Remover RequireTeam
- `src/components/layout/Header.tsx` -- Mover Escalacao e Ranking para nav publica
- `src/components/EstatisticasPartidaForm.tsx` -- Adicionar selecao de MVP
- `src/pages/admin/AdminResultados.tsx` -- Exibir MVP selecionado
- `src/hooks/useEstatisticas.ts` -- Atualizar ranking de destaques para usar mvp_jogador_id

### Arquivos que podem ser removidos futuramente (nao usados mais)
- `src/components/VotacaoDestaque.tsx` -- Se a votacao de destaque nao for mais usada em nenhum lugar
- `src/hooks/useVotacaoDestaque.ts` -- Idem
- `src/components/ConfirmacaoPresenca.tsx` -- Se nao for usada em mais nenhum lugar
