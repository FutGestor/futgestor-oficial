

## Problema real

O admin `futgestor@gmail.com` acessa tudo porque tem "god mode" (lista especial no codigo). Porem, o time "Demo FC" nao tem nenhum registro de assinatura na tabela `subscriptions`. Quando o jogador `cst.empresadigital@gmail.com` loga, o sistema busca a assinatura do time e nao encontra nada -- por isso mostra o paywall.

A arquitetura ja funciona corretamente: o jogador herda o plano do time via `profile.team_id` -> `subscriptions.team_id`. O problema eh que o god mode so beneficia o email especifico, nao o time inteiro.

## Solucao

Estender o god mode para que todos os membros do time de um admin god mode tambem tenham acesso completo.

### Alteracao

**Arquivo: `src/hooks/useSubscription.ts`**

Na funcao `useSubscription`, alem de verificar se o usuario atual esta na lista god mode, tambem verificar se o time do usuario pertence a um admin god mode. Para simplificar, a abordagem sera:

1. Buscar os emails dos admins do time atual
2. Se algum admin do time estiver na lista god mode, retornar assinatura "liga" fake (mesmo comportamento atual do god mode)

Isso garante que:
- Qualquer jogador de um time cujo admin eh god mode tera acesso total
- Times com assinaturas reais continuam funcionando normalmente
- Nenhuma mudanca no banco de dados eh necessaria

### Alternativa mais simples (recomendada)

Criar um registro real de assinatura "liga" para o time Demo FC no banco de dados. Isso resolve o caso imediato sem mudar codigo:

```sql
INSERT INTO subscriptions (team_id, plano, status)
VALUES ('7d8ddfcd-c688-4d25-afc9-972019fb2454', 'liga', 'active');
```

E tambem estender o god mode no codigo para abranger todo o time, para que futuros times de admins god mode nao tenham o mesmo problema.

### Detalhes tecnicos

**Arquivo: `src/hooks/useSubscription.ts`**

Na funcao `useSubscription`:
- Adicionar uma query secundaria que busca se algum admin do time eh god mode
- Se sim, retornar a assinatura fake "liga" mesmo para usuarios nao-god-mode
- Usar o `team_id` do perfil para fazer essa verificacao

**Migracao SQL:**
- Inserir assinatura "liga" ativa para o time Demo FC (resolve o caso imediato)

### Resultado esperado
- O jogador `cst.empresadigital@gmail.com` vera todas as funcionalidades do plano Liga (Financeiro, Ranking, Avisos, etc.)
- A area Admin continua bloqueada pois o jogador tem role "user", nao "admin"
- Qualquer novo jogador criado por um admin god mode tambem tera acesso completo

