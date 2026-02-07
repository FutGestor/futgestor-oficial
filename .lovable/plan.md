

# Recuperacao de Senha

## Problema
A senha cadastrada nao esta funcionando e nao existe opcao de recuperar senha na tela de login.

## O que sera feito

### 1. Resetar sua senha atual
Como nao tenho acesso a senha original (ela e criptografada), vou usar o Supabase Admin API para redefinir sua senha para uma temporaria. Voce podera troca-la depois.

### 2. Adicionar "Esqueci minha senha" na tela de login
Adicionar um link "Esqueci minha senha" abaixo do formulario de login que envia um email de recuperacao para o usuario.

## Detalhes Tecnicos

### Reset de senha via migracao
Usar a funcao administrativa do Supabase para atualizar a senha do usuario `futgestor@gmail.com`.

### Alteracoes no arquivo `src/pages/Auth.tsx`
- Adicionar um estado `forgotPassword` para alternar entre login e recuperacao
- Criar um formulario simples que pede o email e chama `supabase.auth.resetPasswordForEmail()`
- Adicionar link "Esqueci minha senha" no formulario de login
- Criar uma pagina ou logica para receber o token de reset e permitir definir nova senha

### Fluxo de recuperacao
1. Usuario clica em "Esqueci minha senha"
2. Digita o email
3. Sistema envia email com link de recuperacao via `supabase.auth.resetPasswordForEmail()`
4. Usuario clica no link, e redirecionado de volta ao app
5. App detecta o evento `PASSWORD_RECOVERY` no `onAuthStateChange` e exibe formulario para nova senha

### Arquivos afetados
- `src/pages/Auth.tsx` - Adicionar formulario de recuperacao e link
- `src/hooks/useAuth.tsx` - Adicionar tratamento do evento `PASSWORD_RECOVERY` no listener de auth state

