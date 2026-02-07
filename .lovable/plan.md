

# Correcao do Erro "Auth session missing!" na Recuperacao de Senha

## Problema
Quando voce clica no link de recuperacao no email, o Supabase processa o token e dispara o evento `PASSWORD_RECOVERY` com uma sessao valida. Porem, o codigo atual usa `window.location.href = '/auth?type=recovery'` que faz um reload completo da pagina, destruindo a sessao que acabou de ser criada. Por isso, quando voce tenta redefinir a senha, o erro "Auth session missing!" aparece.

## Solucao
Trocar o `window.location.href` por uma navegacao via React Router (sem reload) para preservar a sessao em memoria.

## Detalhes Tecnicos

### Arquivo: `src/hooks/useAuth.tsx`
- Remover o `window.location.href = '/auth?type=recovery'` (linha 44)
- Adicionar um estado `passwordRecovery` no contexto de autenticacao para sinalizar que o evento de recuperacao ocorreu
- Expor esse estado no contexto para que a pagina de Auth possa reagir a ele

### Arquivo: `src/pages/Auth.tsx`
- Usar o estado `passwordRecovery` do contexto de auth para exibir o formulario de redefinicao de senha, em vez de depender apenas do parametro `type=recovery` na URL
- Quando o evento de recuperacao ocorrer, alternar automaticamente para a view "reset" sem recarregar a pagina

### Resultado esperado
Ao clicar no link de recuperacao do email, o app vai manter a sessao ativa e exibir o formulario de nova senha sem erro.

