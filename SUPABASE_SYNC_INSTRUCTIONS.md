# 🗄️ Instruções de Sincronização do Supabase

**Data:** 2026-02-20  
**Arquivo:** `20250220_consolidated_fix.sql`

---

## ⚠️ Atenção

O comando `supabase db push` falhou porque algumas migrations já existem no banco.  
**Execute o arquivo SQL manualmente no Dashboard do Supabase.**

---

## 📋 Passo a Passo

### 1. Acesse o Dashboard
1. Vá em [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral

### 2. Execute o SQL
1. Crie uma **"New query"**
2. Abra o arquivo: `supabase/migrations/20250220_consolidated_fix.sql`
3. Cole todo o conteúdo no editor
4. Clique em **"Run"**

---

## ✅ O que será criado/atualizado

| Item | Descrição |
|------|-----------|
| `ml_escalacao_padroes` | Tabela para padrões de escalação ML |
| `get_financial_summary` | Função RPC para resumo financeiro |
| `get_player_stats` | Função RPC para estatísticas de jogadores |
| `get_player_performance` | Função RPC para performance individual |
| `trg_notify_new_game` | Trigger para notificações de novo jogo |

---

## 🔍 Verificação

Após executar, verifique se as funções existem:

```sql
-- Verificar funções
SELECT * FROM pg_proc WHERE proname IN (
  'get_financial_summary', 
  'get_player_stats', 
  'get_player_performance',
  'notify_new_game'
);

-- Verificar tabela
SELECT * FROM ml_escalacao_padroes LIMIT 1;

-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trg_notify_new_game';
```

---

## 📝 Notas

- As funções são **idempotentes** (podem ser executadas múltiplas vezes)
- As políticas RLS são recriadas para garantir permissões corretas
- O trigger só cria notificações se o jogador tiver `user_id` vinculado

---

**Execute o SQL e confirme quando terminar para prosseguirmos com a tipagem!**
