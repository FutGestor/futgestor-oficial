

## Redesign do Dashboard Financeiro + Forcar Tema Dark

### O que sera feito

**1. Forcar tema dark (remover opcao de tema claro)**

- **`src/components/ThemeToggle.tsx`**: Remover o componente completamente ou transformar em componente vazio
- **`src/components/layout/Header.tsx`**: Remover o `<ThemeToggle />` do header (linha 102)
- **`src/main.tsx`** ou **`src/App.tsx`**: Adicionar `document.documentElement.classList.add("dark")` na inicializacao para garantir que o tema dark seja sempre aplicado

**2. Redesign do Dashboard Financeiro (`src/pages/Financeiro.tsx`)**

Inspirado no estilo do mockup da landing page (ShowcaseFinanceiro), com visual premium dark:

- **Cards de resumo**: Layout centralizado com valores grandes, cores vibrantes (dourado para saldo, verde para arrecadado, vermelho para gasto), fundo escuro com bordas sutis (`bg-[#0A1628] border border-white/[0.06]`)
- **Graficos**: Barras com cores semi-transparentes (verde/vermelho com opacidade), pie chart com estilo donut moderno, tudo com fundo escuro consistente
- **Tabela de transacoes**: Substituir a tabela tradicional por cards com layout limpo (descricao a esquerda, valor colorido a direita), similar ao mockup da landing page
- **Tipografia**: Labels em uppercase com tracking largo, texto em cinza claro, valores em destaque
- **Evolucao do saldo**: Manter o line chart mas com cores adaptadas ao tema dark (linha dourada, grid sutil)

### Secao tecnica

**Arquivos modificados:**
1. `src/components/ThemeToggle.tsx` - Simplificar ou remover
2. `src/components/layout/Header.tsx` - Remover referencia ao ThemeToggle
3. `src/App.tsx` - Forcar classe "dark" no document
4. `src/pages/Financeiro.tsx` - Redesign completo do layout visual mantendo a mesma logica de dados

**Cores do novo design:**
- Fundo principal: `bg-[#0A1628]`
- Cards: `bg-[#0F2440] border border-white/[0.06]`
- Texto principal: `text-white` / `text-gray-300`
- Labels: `text-gray-500 uppercase tracking-wider`
- Saldo: `text-[#D4A84B]` (dourado)
- Entradas: `text-green-400`
- Saidas: `text-red-400`

**Graficos (recharts):**
- Barras verdes/vermelhas com opacidade 60%
- Grid com stroke branco sutil
- Tooltip com fundo dark
- Pie chart estilo donut com cores vibrantes
