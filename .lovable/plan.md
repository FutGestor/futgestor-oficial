

## Senha padrao fixa para acesso dos jogadores

### Resumo
Remover a geracao de senha aleatoria e usar a senha fixa `2508futgestor5515@` para todos os jogadores. Tambem corrigir o toast no frontend para exibir a senha real.

### Alteracoes

**1. Backend - `supabase/functions/create-player-access/index.ts`**
- Remover toda a funcao `generatePassword()` (linhas 101-116)
- Substituir por senha fixa: `const defaultPassword = "2508futgestor5515@";`

**2. Frontend - `src/pages/admin/AdminJogadores.tsx`**
- Corrigir o toast (linha 252) para exibir `data.message` retornado pelo backend, que contera o email e a senha real

### Resultado
- Todo jogador criado tera a senha `2508futgestor5515@`
- O admin vera a senha correta no toast apos gerar o acesso
- Sem necessidade de servico de email externo -- o admin compartilha a senha via WhatsApp

