

# Corrigir Nome do Cliente no Dashboard de Vendas

## Problema
A FK entre `saas_payments` e `teams` foi criada, porem o cache de schema do PostgREST ainda nao reconhece essa relacao. Por isso, o join `teams(nome)` retorna `null` na API, mesmo com os dados corretos no banco.

## Solucao

Alterar o codigo em `SuperAdminVendas.tsx` para buscar os nomes dos times separadamente, sem depender do join automatico do PostgREST.

### Alteracoes em `src/pages/SuperAdminVendas.tsx`

1. **Buscar pagamentos sem join** — trocar `.select("*, teams(nome)")` por `.select("*")`
2. **Buscar nomes dos times separadamente** — apos obter os pagamentos, coletar os `team_id`s unicos e buscar os nomes na tabela `teams`
3. **Montar um mapa de nomes** — criar um `Record<string, string>` mapeando `team_id -> nome`
4. **Exibir o nome na tabela** — usar o mapa para mostrar o nome do time em vez de depender do campo `teams` embutido

### Logica resumida

```text
1. SELECT * FROM saas_payments ORDER BY created_at DESC LIMIT 100
2. Extrair team_ids unicos dos resultados
3. SELECT id, nome FROM teams WHERE id IN (team_ids)
4. Montar mapa { team_id: nome }
5. Exibir mapa[payment.team_id] na coluna "Time / Cliente"
```

---

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/SuperAdminVendas.tsx` | Buscar nomes dos times separadamente e exibir via mapa |

Nenhuma alteracao no banco de dados e necessaria.
