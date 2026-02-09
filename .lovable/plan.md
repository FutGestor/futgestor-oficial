

## Enviar senha por email ao gerar acesso do jogador

### Problema identificado
O codigo frontend (linha 252 de `AdminJogadores.tsx`) exibe a senha fixa `123456` no toast, ignorando a senha real gerada pela funcao backend. A funcao backend gera uma senha aleatoria de 8 caracteres com letras, numeros e caracteres especiais, mas essa informacao nao chega ao admin corretamente.

### Solucao proposta
Duas correcoes:

**1. Corrigir o toast para mostrar a senha real (correcao imediata)**
- Atualizar linha 252 de `AdminJogadores.tsx` para usar `data.message` (que ja contem email e senha reais retornados pelo backend)

**2. Enviar a senha por email ao jogador**
- Sera necessario configurar o servico Resend para envio de emails
- Voce precisara:
  1. Criar uma conta em https://resend.com (se ainda nao tiver)
  2. Validar seu dominio em https://resend.com/domains
  3. Criar uma API key em https://resend.com/api-keys
  4. Fornecer a chave `RESEND_API_KEY` quando solicitado

- A funcao backend `create-player-access` sera atualizada para enviar um email ao jogador com suas credenciais (email e senha) apos criar o acesso
- O email tera um template simples informando o jogador sobre seu acesso ao FutGestor

### Detalhes tecnicos

**Arquivo: `src/pages/admin/AdminJogadores.tsx`**
- Linha 252: trocar `Senha: 123456` por exibir `data.message` que ja contem as credenciais reais

**Arquivo: `supabase/functions/create-player-access/index.ts`**
- Adicionar integracao com Resend para enviar email ao jogador apos criacao do acesso
- O email contera: nome do time, email de login e senha gerada
- Manter o retorno da senha no response para o admin tambem visualizar no toast

### Fluxo apos implementacao

```text
Admin clica "Gerar Acesso"
       |
       v
Backend cria usuario com senha aleatoria
       |
       v
Backend envia email ao jogador com credenciais
       |
       v
Frontend exibe toast com email e senha reais
```

### Prerequisito
Configuracao da chave `RESEND_API_KEY` como secret do projeto.

