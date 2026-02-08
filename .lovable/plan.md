

## Ajuste no texto do FAQ - Login de Jogadores

### Problema
O texto atual menciona "quanto deve de mensalidade", o que nao faz sentido. O jogador tem acesso as financas do time e avisos, nao apenas a uma mensalidade individual.

### Alteracao

**Arquivo:** `src/components/landing/FaqSection.tsx` (linha 28)

**Texto atual:**
> "No Plano Liga, cada atleta recebe um acesso exclusivo ao sistema. Ele pode ver quanto deve de mensalidade, confirmar presenca nos jogos e acompanhar suas estatisticas -- tirando todo esse trabalho do administrador."

**Novo texto:**
> "No Plano Liga, o administrador pode gerar um login individual para cada atleta. Com esse login, o jogador acessa sua area pessoal, onde pode acompanhar as financas do time, ver avisos e confirmar presenca nos jogos. Ele nao tem acesso a area administrativa -- apenas o dono/admin gerencia tudo."

### Detalhes tecnicos
- Alteracao de texto em uma unica linha do array `faqs` no componente `FaqSection.tsx`
- Sem mudanca de logica ou estrutura

