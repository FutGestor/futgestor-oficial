

# Acesso Rapido a Landing Page

## Problema
Atualmente, a rota `/` redireciona automaticamente para `/time/{slug}` quando existe um slug salvo no `localStorage`, tornando a Landing Page inacessivel sem ferramentas de desenvolvedor.

## Solucao

### 1. Criar rota dedicada `/site`
**Arquivo: `src/App.tsx`**
- Adicionar uma rota `/site` que renderiza diretamente o `LandingPage`, sem nenhuma logica de redirecionamento.

### 2. Adicionar link no Footer da pagina do time
**Arquivo: `src/components/layout/Footer.tsx`**
- Adicionar um link "Conheca o FutGestor" ou "FutGestor" que aponta para `/site`, permitindo acesso rapido a partir de qualquer pagina do time.

### 3. Adicionar link no Footer da Landing Page
**Arquivo: `src/components/landing/LandingFooter.tsx`**
- Atualizar o link "FutGestor" no footer para apontar para `/site` tambem, garantindo consistencia.

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Nova rota `/site` apontando para `LandingPage` |
| `src/components/layout/Footer.tsx` | Link "Conheca o FutGestor" apontando para `/site` |
| `src/components/landing/LandingFooter.tsx` | Atualizar links internos para `/site` |

