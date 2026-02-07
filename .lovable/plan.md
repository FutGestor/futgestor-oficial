
# Melhorias no Player Dashboard e Seguranca de Senha

## 1. Botao "Voltar ao Time" no Player Dashboard

Adicionar um botao no header do `/player/dashboard` que leva o jogador de volta a pagina publica do time dele. Usaremos o `slug` do time (ja carregado via `team.data`) para montar a rota `/time/[slug]`.

- Adicionar icone de seta (ArrowLeft) ao lado esquerdo do header ou um botao "Meu Time" visivel
- O botao navegara para `/time/${teamData.slug}`

## 2. Senha Aleatoria Segura (8 caracteres)

Substituir a senha fixa `123456` por uma senha gerada aleatoriamente com 8 caracteres contendo letras maiusculas, minusculas, numeros e caracteres especiais.

- A funcao de geracao ficara dentro da edge function `create-player-access`
- A senha gerada sera retornada na resposta para que o admin possa enviar ao jogador via WhatsApp

---

## Detalhes Tecnicos

### PlayerDashboard.tsx
- Importar `ArrowLeft` do lucide-react
- No header, adicionar um botao antes da foto do jogador que navega para `/time/${teamData?.slug}` (ou `/` se slug nao disponivel)

### create-player-access/index.ts
- Criar funcao `generatePassword()` que gera 8 caracteres aleatorios com mix de: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*`
- Garantir ao menos 1 maiuscula, 1 minuscula, 1 numero e 1 especial
- Substituir `const defaultPassword = "123456"` pela chamada dessa funcao
- A resposta ja retorna a senha no campo `message`, entao o admin continuara vendo a senha gerada para repassar ao jogador
