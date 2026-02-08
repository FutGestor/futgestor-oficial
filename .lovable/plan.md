

# Plano: Corrigir Features dos Planos (Codigo + Landing Page + Admin)

## O que muda

Hoje o Ranking esta acessivel no Basico. Voce quer que ele seja **Pro+**. E as listas de features na landing page e admin precisam refletir isso.

## Resumo dos planos corretos

| Feature | Basico | Pro | Liga |
|---------|--------|-----|------|
| Dashboard do time | Sim | Sim | Sim |
| Gerenciamento de Jogos | Sim | Sim | Sim |
| Escalacoes | Sim | Sim | Sim |
| Portal Publico do Time | Sim | Sim | Sim |
| Ranking de jogadores | Nao | Sim | Sim |
| Resultados e Estatisticas | Nao | Sim | Sim |
| Confirmacao de Presenca | Nao | Sim | Sim |
| Controle Financeiro | Nao | Sim | Sim |
| Avisos e Comunicados | Nao | Sim | Sim |
| Solicitacoes de Amistosos | Nao | Sim | Sim |
| Estatisticas Avancadas | Nao | Sim | Sim |
| Campeonatos e Torneios | Nao | Nao | Sim |
| Login para Jogadores | Nao | Nao | Sim |
| Suporte Prioritario | Nao | Nao | Sim |

## Alteracoes por arquivo

### 1. `src/hooks/useSubscription.ts`
- Mover `hasResultados` de `planLevel >= 1` para `planLevel >= 2` (Pro+)
- Adicionar `hasRanking: planLevel >= 2` (Pro+)
- Adicionar `hasPresenca: planLevel >= 2` (Pro+)
- Adicionar `hasSolicitacoes: planLevel >= 2` (Pro+)
- Adicionar `hasEstatisticasAvancadas: planLevel >= 2` (Pro+)

### 2. `src/components/landing/PricingSection.tsx`
Corrigir as listas de features:

**Basico:**
- Dashboard do time
- Gerenciamento de Jogos
- Escalacao Tatica (Campo Virtual)
- Portal Publico do Time

**Pro:**
- Tudo do Basico +
- Ranking de Jogadores
- Resultados e Estatisticas
- Confirmacao de Presenca
- Controle Financeiro completo
- Avisos e Comunicados
- Solicitacoes de Amistosos
- Estatisticas Avancadas por Jogador

**Liga:**
- Tudo do Pro +
- Campeonatos e Torneios
- Login para Jogadores
- Convidar Jogadores (acesso externo)
- Suporte Prioritario

Remover todos os limites falsos (15 jogadores, 5 jogos, jogadores ilimitados, 3 times).

### 3. `src/pages/admin/AdminPlanos.tsx`
Mesma correcao nas listas de features para ficar alinhado.

### 4. `src/components/landing/FeaturesGrid.tsx`
Corrigir badges dos cards:
- "Confirmacao de Presenca" -> badge **Pro** (era Basico)
- "Resultados e Estatisticas" -> badge **Pro** (era Basico)
- "Elenco Completo" (que inclui Ranking) -> badge **Pro** (era Basico)
- "Ranking com Podio" -> badge **Pro** (era Liga)
- "Votacao de Destaque" -> manter **Liga**

### 5. `src/pages/Admin.tsx`
Travar na sidebar os itens que sao Pro+:
- Ranking -> `hasRanking`
- Resultados -> `hasResultados`
- Solicitacoes -> `hasSolicitacoes`

(Presenca e estatisticas avancadas sao travadas dentro dos componentes onde sao usadas)

