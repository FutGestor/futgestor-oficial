

# Gestor de Campeonatos (League Manager)

Funcionalidade exclusiva do plano **Liga** que permite ao Admin criar campeonatos, cadastrar times, lançar resultados e gerar automaticamente a Tabela de Classificação.

---

## 1. Banco de Dados - 3 novas tabelas

### `leagues`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, gen_random_uuid() |
| team_id | uuid | FK para teams (multi-tenant) |
| name | text | Nome do campeonato |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `league_teams`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK |
| league_id | uuid | FK para leagues |
| name | text | Nome do time |
| logo_url | text | Opcional |
| created_at | timestamptz | default now() |

### `league_matches`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK |
| league_id | uuid | FK para leagues |
| round | integer | Numero da rodada |
| team_home_id | uuid | FK para league_teams |
| team_away_id | uuid | FK para league_teams |
| score_home | integer | Nullable (null = nao jogado) |
| score_away | integer | Nullable |
| status | text | 'agendado' ou 'finalizado', default 'agendado' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### RLS (Row-Level Security)
- **leagues**: Admins do team podem gerenciar (ALL); leitura publica (SELECT true) para exibir na pagina publica.
- **league_teams**: Admins do team da league podem gerenciar; leitura publica via join com leagues.
- **league_matches**: Admins do team da league podem gerenciar; leitura publica via join com leagues.

---

## 2. Interface Admin - Nova aba "Campeonatos"

### Sidebar (Admin.tsx)
- Adicionar item "Campeonatos" com icone `Trophy` entre "Resultados" e "Escalacoes".
- Protegido: `locked: !hasCampeonatos` (requiredPlan: "Liga").
- O hook `usePlanAccess` ja possui `hasCampeonatos` (planLevel >= 3).

### Pagina `AdminCampeonatos.tsx`
**Tela inicial**: Lista de campeonatos criados com botao "Criar Novo Campeonato" (dialog com input de nome).

**Dentro do Campeonato** (ao clicar): Navega para `AdminCampeonatoDetalhe.tsx` usando rota `/admin/campeonatos/:leagueId`.

#### Tab 1 - Classificacao (Automatica)
- Tabela estilo "Globo Esporte" usando componentes Table do Shadcn.
- Colunas: Pos, Time (com logo), PTS, J, V, E, D, GP, GC, SG.
- Logica calculada no frontend a partir dos `league_matches` finalizados:
  - Vitoria = 3 pts, Empate = 1 pt, Derrota = 0 pts.
  - Desempate: Pontos > Vitorias > Saldo de Gols.
- Visual: 1o colocado com fundo verde, ultimos 25% (Z-4) com fundo vermelho.

#### Tab 2 - Jogos/Rodadas
- Lista de jogos agrupados por rodada.
- Botao "Adicionar Jogo": dialog com selects de Time A, Time B e numero da Rodada.
- Edicao rapida de placar: clicar no jogo abre modal com inputs numericos para score_home e score_away + botao "Finalizar".
- Ao salvar, a aba de Classificacao recalcula automaticamente (invalidacao do query cache).

#### Tab 3 - Times
- Lista de times com nome e escudo.
- Botao "Adicionar Time": dialog com input de Nome e upload de escudo (usando bucket `times` existente).
- Botao de excluir time (com confirmacao).

### Rotas (Admin.tsx)
Adicionar:
```
<Route path="/campeonatos" element={<AdminCampeonatos />} />
<Route path="/campeonatos/:leagueId" element={<AdminCampeonatoDetalhe />} />
```

---

## 3. Visualizacao Publica

### TeamPublicPage.tsx
- Nova secao "Nossos Campeonatos" abaixo do conteudo existente.
- Busca leagues onde `team_id = team.id`.
- Para cada campeonato, exibe a Tabela de Classificacao compacta (mesmo componente reutilizado).
- Visivel para qualquer visitante (sem necessidade de login).

---

## 4. Novos arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useLeagues.ts` | Hooks: useLeagues, useLeagueTeams, useLeagueMatches, useStandings |
| `src/pages/admin/AdminCampeonatos.tsx` | Lista de campeonatos + criar novo |
| `src/pages/admin/AdminCampeonatoDetalhe.tsx` | Detalhe com 3 tabs |
| `src/components/LeagueStandingsTable.tsx` | Tabela de classificacao reutilizavel (admin + publico) |

---

## 5. Detalhes Tecnicos

### Calculo da Classificacao (frontend)
```text
Para cada league_match com status = 'finalizado':
  - Se score_home > score_away: home ganha 3pts, away 0
  - Se score_home < score_away: away ganha 3pts, home 0
  - Se score_home = score_away: ambos ganham 1pt
  
Ordenar por: pontos DESC, vitorias DESC, saldo_gols DESC
```

### Migracao SQL
- Criar 3 tabelas com FKs e indexes.
- RLS: leitura publica nas 3 tabelas; escrita restrita a team admins via `is_team_admin()` com join na league.
- Trigger `update_updated_at_column` nas tabelas com `updated_at`.

### UX
- Cores: 1o lugar com `bg-green-100 dark:bg-green-950/30`, Z-4 com `bg-red-100 dark:bg-red-950/30`.
- Upload de escudo usa o bucket `times` ja existente (publico).
- Modal de edicao rapida de placar com inputs type="number" min=0.

