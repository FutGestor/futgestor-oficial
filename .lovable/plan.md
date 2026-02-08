

# Plano de Melhorias: Pricing, Mockups, Fonte e Modo Deus

## 1. Corrigir Tabela de Precos (PricingSection.tsx)

**Problema atual:** Todos os 3 planos mostram as mesmas features como uma lista sequencial (ex: Pro mostra "Ate 15 jogadores" e "Ate 5 jogos por mes", quando deveria mostrar "Jogadores ilimitados"). Isso nao reflete o que cada plano realmente oferece.

**Correcao:** Trocar a logica de lista unica com `included` count por listas independentes para cada plano:

- **Basico (R$ 9,90):** Ate 15 jogadores, Ate 5 jogos/mes, Agenda de Jogos, Escalacao Tatica, Resultados e Estatisticas, Confirmacao de Presenca, Portal Publico do Time
- **Pro (R$ 19,90):** Jogadores ilimitados, Jogos ilimitados, Tudo do Basico +, Controle Financeiro completo, Avisos e Comunicados, Solicitacoes de Amistosos, Redes Sociais no Portal, Estatisticas Avancadas por Jogador
- **Liga (R$ 39,90):** Tudo do Pro +, Ate 3 times no mesmo painel, Campeonatos e Torneios, Ranking entre Times, Suporte Prioritario

Cada plano tera sua propria lista de features com checks verdes apenas no que esta incluso.

---

## 2. Atualizar Mockups das Showcases

Os mockups atuais sao genericos e nao refletem o visual real do app. Vou atualizar para se aproximar mais das telas reais:

### ShowcaseDashboard.tsx
- Mudar de 3 cards (Saldo, Jogadores, Prox jogos) para 4 cards como no app real: **Saldo Atual**, **Jogadores Ativos**, **Proximos Jogos**, **Jogos Finalizados**
- Trocar a secao de escalacao por cards de atalhos rapidos (Gerenciar Jogos, Gerenciar Jogadores, etc) como no dashboard real

### ShowcaseFinanceiro.tsx  
- Adicionar cards de resumo no topo: Saldo Atual, Total Arrecadado, Total Gasto (como no app real)
- Manter grafico de barras (Entradas vs Saidas) mas adicionar grafico pizza (Gastos por Categoria) ao lado
- Adicionar secao de Evolucao do Saldo
- Adicionar mini tabela de Historico de Transacoes

### ShowcasePresenca.tsx
- Adicionar resumo de badges no topo (1 confirmado, 0 indisponiveis, 0 pendentes)
- Mostrar avatar/inicial do jogador + posicao abaixo do nome
- Botoes de acao (confirmar, negar, pendente) em vez de texto

### ShowcaseCampeonatos.tsx
- Expandir tabela com mais colunas: PTS, J, GP, GC, SG (como no app real)
- Adicionar secao lateral "Jogos da Rodada" com dropdown de rodada e cards de resultados

---

## 3. Trocar Fonte dos Titulos da Landing Page

**Atual:** Bebas Neue (condensada, uppercase rigido)
**Nova:** Trocar para **Outfit** — uma fonte geometric sans moderna, ousada e legivel. Funciona bem para titulos grandes e tem peso extra-bold.

Alteracoes:
- `index.html`: Adicionar Google Font "Outfit" (weights 700, 800, 900)
- `tailwind.config.ts`: Mudar `fontFamily.display` de `Bebas Neue` para `Outfit`
- Landing page: Os titulos continuam uppercase mas com a nova fonte

---

## 4. Modo Desenvolvedor (Simular Plano)

Adicionar secao em `AdminConfiguracoes.tsx` visivel APENAS para `futgestor@gmail.com`:

- Card "Modo Desenvolvedor" com icone de engrenagem/codigo
- Dropdown "Simular Plano" com opcoes: Basico, Pro, Liga
- Ao selecionar, faz UPDATE na tabela `subscriptions` mudando o campo `plano` para o valor selecionado
- Se nao existir subscription, faz INSERT com status "active"
- Botao "Resetar para plano real" que remove a subscription simulada (DELETE) para voltar ao estado real
- Precisa desativar o God Mode temporariamente para que a simulacao funcione

**Alteracao no useSubscription.ts:**
- Adicionar flag `simulatingPlan` via localStorage
- Quando `simulatingPlan` esta ativo, o God Mode e ignorado e a subscription real do banco e usada
- Isso permite que o super admin veja as restricoes reais de cada plano

---

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/landing/PricingSection.tsx` | Listas de features independentes por plano |
| `src/components/landing/ShowcaseDashboard.tsx` | Mockup com 4 cards + atalhos rapidos |
| `src/components/landing/ShowcaseFinanceiro.tsx` | Mockup com resumo, graficos e historico |
| `src/components/landing/ShowcasePresenca.tsx` | Mockup com avatares, badges e botoes |
| `src/components/landing/ShowcaseCampeonatos.tsx` | Tabela expandida + jogos da rodada |
| `index.html` | Adicionar fonte Outfit |
| `tailwind.config.ts` | Trocar font-display para Outfit |
| `src/pages/admin/AdminConfiguracoes.tsx` | Secao Modo Desenvolvedor |
| `src/hooks/useSubscription.ts` | Flag de simulacao via localStorage |

