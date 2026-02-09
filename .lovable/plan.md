

## Classificacao sem scroll horizontal no celular

### Problema
A tabela de classificacao na aba Liga mostra muitas colunas mesmo no modo compacto, causando scroll horizontal no celular.

### Solucao
Esconder as colunas GP (Gols Pro) e GC (Gols Contra) no mobile, mantendo apenas as colunas essenciais: #, Time, PTS, J e SG. Isso faz a tabela caber na tela sem scroll lateral.

### Detalhes tecnicos

**Arquivo: `src/components/LeagueStandingsTable.tsx`**

- Adicionar classes `hidden sm:table-cell` nas colunas GP e GC (tanto no `TableHead` quanto no `TableCell`)
- Isso esconde essas colunas em telas menores que 640px e as mostra normalmente em telas maiores
- As colunas V, E, D ja sao escondidas pelo modo `compact` -- GP e GC passam a ser escondidas tambem no mobile
- SG (Saldo de Gols) continua visivel pois resume a informacao de GP e GC

**Resultado:** 5 colunas no mobile (#, Time, PTS, J, SG) -- cabe perfeitamente na tela sem scroll horizontal.
