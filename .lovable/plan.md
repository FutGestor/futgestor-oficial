

# Corrigir Nome do Cliente no Dashboard de Vendas

## Problema
A coluna "Time / Cliente" mostra "—" porque a tabela `saas_payments` nao possui uma foreign key para a tabela `teams`. Sem essa FK, o join automatico `teams(nome)` nao funciona no Supabase.

## Solucao

### 1. Criar foreign key entre saas_payments e teams
Adicionar uma migration SQL para criar a constraint de FK entre `saas_payments.team_id` e `teams.id`.

```sql
ALTER TABLE public.saas_payments
  ADD CONSTRAINT saas_payments_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id);
```

### 2. Nenhuma alteracao no codigo
O codigo em `SuperAdminVendas.tsx` ja faz `.select("*, teams(nome)")` corretamente. Assim que a FK existir, o Supabase vai resolver o join automaticamente e o nome do time aparecera na tabela.

---

## Resumo

| Alteracao | Detalhe |
|-----------|---------|
| Migration SQL | Adicionar FK `saas_payments.team_id -> teams.id` |
| Codigo | Nenhuma alteracao necessaria |

