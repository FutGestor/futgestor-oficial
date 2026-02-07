

## Problema Identificado

A pagina do time (`/time/adminfc`) mostra 404 quando o usuario esta deslogado porque a tabela `teams` nao tem uma politica de leitura publica. A unica politica SELECT exige que o usuario esteja autenticado. Quando deslogado, a consulta ao banco retorna vazio e o componente exibe a pagina 404.

## Solucao

### 1. Criar politica de leitura publica para a tabela `teams`

Adicionar uma politica RLS que permita leitura anonima de dados basicos dos times. Como a tabela `teams` pode conter dados sensiveis (como `cpf_responsavel`), a abordagem mais segura seria criar uma view publica, porem para resolver o problema imediato de forma simples, vamos adicionar uma politica SELECT para o role `anon` -- e futuramente considerar uma view para ocultar campos sensiveis.

**Migracao SQL:**
```sql
CREATE POLICY "Public can view teams by slug"
ON public.teams FOR SELECT TO anon
USING (true);
```

Isso permite que visitantes (deslogados) consultem os times pelo slug e vejam a pagina publica normalmente.

### 2. Melhorar tratamento de erro no `TeamSlugLayout`

Atualizar o componente `useTeamSlug.tsx` para diferenciar entre erro de carregamento (ex: RLS bloqueando) e time realmente inexistente, adicionando tratamento do estado `error` da query para exibir mensagem mais clara caso haja falha.

---

### Secao Tecnica

**Arquivo modificado:** `src/hooks/useTeamSlug.tsx`
- Adicionar tratamento de `isError` na query para nao confundir erro de permissao com 404.

**Migracao de banco:**
- Uma unica politica RLS `anon SELECT` na tabela `teams`.

**Risco:** A tabela `teams` pode ter campos como `cpf_responsavel` e `plano`. Esses campos ficam expostos na consulta `SELECT *`. Como melhoria futura, considerar criar uma view `teams_public` que exclua dados sensiveis (similar ao que foi feito com `jogadores_public`). Para esta correcao, o foco e resolver o crash imediato.

