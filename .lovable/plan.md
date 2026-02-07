
# Correções na Landing Page

## Problemas identificados

1. **Botão "Criar meu time" ilegível**: O botão usa `variant="outline"` com `text-primary-foreground` — como o fundo do hero é escuro, o texto do botão fica claro sobre um fundo claro (outline), impossível de ler.

2. **Logo ausente**: O ícone genérico `CircleDot` precisa ser substituído pela logo do FutGestor enviada pelo usuário.

## Correções

### 1. Adicionar a logo ao projeto

- Copiar a imagem `da50adb8-92af-46e8-b5d0-65284c0dfbee.jpg` para `src/assets/logo-futgestor.jpg`
- Também copiar para `public/logo-futgestor.jpg` para uso no HTML/Auth

### 2. `src/pages/Index.tsx`

- Substituir o ícone `CircleDot` pela imagem da logo importada de `@/assets/logo-futgestor.jpg`
- Corrigir o botão "Criar meu time" para usar cores legíveis: trocar `variant="outline"` por `variant="secondary"` ou ajustar as classes para garantir contraste (ex: fundo branco com texto escuro)

### 3. `src/pages/Auth.tsx`

- Substituir o ícone `CircleDot` pela mesma logo do FutGestor na tela de login

## Detalhes Técnicos

**Index.tsx** — substituir:
```tsx
<CircleDot className="mb-6 h-20 w-20 text-primary-foreground/90" />
```
por:
```tsx
<img src={logoFutgestor} alt="FutGestor" className="mb-6 h-24 w-auto" />
```

**Index.tsx** — botão "Criar meu time": trocar para `variant="secondary"` para manter a legibilidade.

**Auth.tsx** — substituir o `CircleDot` pela mesma logo com tamanho menor (`h-16`).
