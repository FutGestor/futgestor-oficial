
# Plano: Correcoes de Bugs e Restricoes de Plano

## Problemas Identificados e Solucoes

### 1. Presenca e Link de Presenca acessiveis no plano Basico

**Problema:** No `AdminJogos.tsx`, o botao "Presencas" e o componente `PresencaLinkDialog` aparecem para todos os planos, sem verificar `hasPresenca`.

**Solucao:** Importar `usePlanAccess` no `AdminJogos.tsx` e condicionar a exibicao dos botoes de presenca (`<Button>Presencas</Button>` e `<PresencaLinkDialog>`) ao flag `hasPresenca`. Quando o plano nao tiver acesso, mostrar cadeado ou nao renderizar os botoes.

**Arquivo:** `src/pages/admin/AdminJogos.tsx` (linhas 585-593 no componente JogoCard)

---

### 2. Escalacao que nao pode ser apagada

**Problema:** Na tela de Escalacoes do admin, existe uma escalacao cujo jogo provavelmente foi deletado (jogo_id aponta para registro inexistente), fazendo com que `escalacao.jogo` seja `null/undefined`. O botao de delete funciona normalmente no codigo (linha 237-253), mas o "vs" aparece sem adversario.

**Solucao:** Verificar se ha escalacoes orfas no banco de dados. Tambem adicionar tratamento no componente para escalacoes sem jogo vinculado (mostrar "Jogo removido" em vez de "vs undefined"). O delete ja funciona pelo codigo - o problema pode ser de RLS ou FK. Vou verificar e adicionar um fallback visual.

**Arquivo:** `src/pages/admin/AdminEscalacoes.tsx` (linhas 531-569)

---

### 3. Solicitacao de Amistosos visivel na pagina publica do Basico

**Problema:** No `TeamPublicPage.tsx`, o componente `ScheduleGameCard` (que permite enviar solicitacoes de amistoso) e exibido para TODOS os times, sem verificar o plano. Na imagem, o time "Basico FC" mostra o card "Quer jogar contra a gente?" mesmo sem ter acesso a Solicitacoes.

**Solucao:** Importar `usePlanAccess` no `TeamPublicPage.tsx` e condicionar a exibicao do `ScheduleGameCard` ao flag `hasSolicitacoes`.

**Arquivo:** `src/pages/TeamPublicPage.tsx` (linhas 421-426)

---

### 4. Agenda de jogos nao deveria estar ativa no plano Basico (pagina publica)

**Problema:** O Header (`Header.tsx`) exibe os links "Agenda", "Resultados", "Escalacao" e "Ranking" para todos os visitantes, independentemente do plano do time. No Basico, "Resultados" e "Ranking" nao deveriam aparecer na navegacao publica, e "Agenda" tambem nao deveria segundo o usuario.

**Solucao:** Ajustar o `Header.tsx` para verificar o plano do time via `usePlanAccess` e condicionar a exibicao dos itens de navegacao. Para o Basico, mostrar apenas "Inicio" e "Escalacao". "Agenda", "Resultados" e "Ranking" ficam disponiveis a partir do Pro.

**Arquivo:** `src/components/layout/Header.tsx` (linhas 24-32)

---

### 5. Header sobrepondo nome do time quando a pagina e encurtada

**Problema:** Na imagem do "galaticos", o nome do time no header e cortado ("gal...") quando a janela e reduzida. O header tem `sticky top-0 z-50` e o nome usa `hidden md:inline-block`, mas em larguras intermediarias pode haver sobreposicao.

**Solucao:** Adicionar `truncate` e `max-w-[120px] lg:max-w-none` ao span do nome do time no header para garantir que ele nao sobreponha a navegacao. Tambem adicionar `overflow-hidden` no container flex do header.

**Arquivo:** `src/components/layout/Header.tsx` (linha 74)

---

### 6. Tabela de Transacoes com scroll horizontal no mobile

**Problema:** Na imagem, a tabela de transacoes no admin mobile exige scroll lateral. As colunas (Data, Descricao, Categoria, Tipo, Valor, Acoes) nao cabem na tela.

**Solucao:** No `AdminTransacoes.tsx`, criar um layout responsivo que no mobile usa cards empilhados (em vez de tabela) e no desktop mantem a tabela. Cada card mostrara: data, descricao, categoria, tipo e valor em layout vertical, com botoes de acao.

**Arquivo:** `src/pages/admin/AdminTransacoes.tsx` (linhas 283-332)

---

### 7. Agenda publica mostrando datas inexistentes como partidas

**Problema:** O calendario da Agenda publica mostra marcacoes em datas que nao possuem jogos reais. Isso pode ocorrer porque a query `useJogos` esta trazendo jogos de outros times ou jogos com status que nao deveriam aparecer.

**Solucao:** Verificar a query `useJogos` no `useData.ts` para garantir que filtra corretamente por `team_id` e que so mostra jogos com status valido (agendado, confirmado). Tambem verificar se o hook esta recebendo o `team_id` correto na pagina publica.

**Arquivo:** `src/pages/Agenda.tsx` e `src/hooks/useData.ts`

---

### 8. Certificar que escalacao funciona corretamente

**Problema:** Garantir que o modulo de escalacao (criar, editar, deletar, publicar) esta funcional.

**Solucao:** Revisar o fluxo completo em `AdminEscalacoes.tsx` e garantir que a exclusao de escalacoes orfas funcione, que a FK constraint com `escalacao_jogadores` seja respeitada (ja esta sendo feita na linha 242), e que a publicacao/ocultacao funcione.

---

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/AdminJogos.tsx` | Bloquear botoes de presenca para plano Basico |
| `src/pages/admin/AdminEscalacoes.tsx` | Tratar escalacoes orfas (sem jogo) |
| `src/pages/TeamPublicPage.tsx` | Esconder ScheduleGameCard para plano Basico |
| `src/components/layout/Header.tsx` | Condicionar nav items ao plano + fix truncate nome |
| `src/pages/admin/AdminTransacoes.tsx` | Layout responsivo com cards no mobile |
| `src/pages/Agenda.tsx` | Verificar filtro de jogos por team_id |
| `src/hooks/useData.ts` | Verificar query useJogos |
