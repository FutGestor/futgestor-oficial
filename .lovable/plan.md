

# Corrigir Navegacao entre Perfil, Admin e Planos

## Problemas Identificados

### 1. Botao "Fazer Upgrade" no Financeiro leva ao lugar errado
O componente `RequireProPlan.tsx` (usado no Financeiro e Avisos) tem um botao "Fazer Upgrade" que redireciona para `/meu-perfil` em vez de `/admin/planos`. Isso cria um loop onde o usuario nunca consegue chegar na pagina de planos.

### 2. Pagina "Meu Perfil" nao oferece caminho claro para o admin
O usuario que acabou de criar o time e direcionado ao `/meu-perfil`, onde ve "Sem plano ativo" mas o botao "Escolher Plano" so aparece para admins (e vai para `/admin/planos`). Se por algum motivo o `isAdmin` nao carregou ainda, o botao nao aparece e o usuario fica preso.

## Solucao

### Arquivo 1: `src/components/RequireProPlan.tsx`
- Alterar o link do botao "Fazer Upgrade" de `basePath/meu-perfil` para `basePath/admin/planos`
- Isso permite que o usuario acesse diretamente a pagina de selecao de planos

### Arquivo 2: `src/components/MeuPlanoSection.tsx`
- Remover a condicao `isAdmin` do botao "Escolher Plano" para que qualquer usuario aprovado veja o botao
- Se nao for admin, o botao levara a uma versao publica dos planos ou diretamente ao `/admin/planos` (que ja permite acesso a rota de planos mesmo sem plano ativo)

### Arquivo 3: `src/pages/Admin.tsx` (paywall redirect)
- Garantir que a rota `/admin/planos` e sempre acessivel para admins, mesmo sem plano ativo (ja funciona, apenas confirmar)

## Detalhes Tecnicos

### RequireProPlan.tsx — Correcao do link
```
Linha 42: Trocar `${basePath}/meu-perfil` por `${basePath}/admin/planos`
```

### MeuPlanoSection.tsx — Mostrar botao para todos
```
Linha 68: Remover condicao `isAdmin &&` para que o botao sempre apareca
Alternativa: manter isAdmin mas adicionar um fallback com link para /auth ou /admin/planos para nao-admins
```

### Nenhuma migration ou dependencia necessaria
Apenas correcoes de rotas e condicoes de exibicao em 2 arquivos.
