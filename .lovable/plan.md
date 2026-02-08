

# Redirecionar Logout para Pagina do Time + Botao Login no Header

## 1. Redirecionamento apos Logout

**Arquivo: `src/pages/Index.tsx`**

Atualmente, quando o usuario desloga, ele cai na Landing Page (rota `/`). O comportamento desejado e redirecionar para a pagina publica do time.

A logica atual so redireciona se o usuario esta logado E tem `team_id`. Para resolver, precisamos armazenar o ultimo slug do time visitado (via `localStorage`) e redirecionar para `/time/{slug}` mesmo quando deslogado.

- Ao carregar o Index, verificar se existe um slug salvo em `localStorage` (ex: `lastTeamSlug`)
- Se existir, redirecionar para `/time/{slug}` independente do estado de login
- O slug sera salvo no `localStorage` pelo `TeamSlugLayout` sempre que o usuario acessar uma pagina de time

**Arquivo: `src/hooks/useTeamSlug.tsx`**

Adicionar um `useEffect` no `TeamSlugLayout` que salva o slug atual no `localStorage` toda vez que o usuario navega para uma rota de time.

## 2. Botao "Entrar" no Header da Landing Page

**Arquivo: `src/components/landing/LandingHeader.tsx`**

Adicionar um botao/link "Entrar" ao lado direito do header, proximo ao botao "Conhecer planos":

- Desktop: link estilizado ou botao com borda, texto "Entrar", que leva para `/auth`
- Mobile: adicionar o mesmo item no menu mobile
- Estilo: botao outline/ghost para nao competir visualmente com o CTA dourado

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Redirecionar para ultimo time visitado via localStorage |
| `src/hooks/useTeamSlug.tsx` | Salvar slug no localStorage ao acessar rota de time |
| `src/components/landing/LandingHeader.tsx` | Adicionar botao "Entrar" linkando para /auth |

