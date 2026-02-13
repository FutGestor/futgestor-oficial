---
name: seo-audit
description: Auditoria técnica de SEO focada em metadados, estrutura de conteúdo e acessibilidade básica.
---

# SEO Audit Skill

Esta skill orienta a verificação técnica de SEO em páginas web, focando em elementos essenciais para indexação e acessibilidade.

## 1. Verificação de Meta Tags

Para cada página importante, verifique a presença e qualidade das seguintes tags no `<head>`:

- **Title Tag**: `<title>...</title>`
  - Deve ser único por página.
  - Idealmente entre 30-60 caracteres.
  - Deve conter a palavra-chave principal.
- **Meta Description**: `<meta name="description" content="...">`
  - Deve ser única por página.
  - Idealmente entre 120-160 caracteres.
  - Deve ser atrativa para clique (CTR).
- **Canonical URL**: `<link rel="canonical" href="...">`
  - Essencial para evitar conteúdo duplicado.
- **Viewport**: `<meta name="viewport" content="...">`
  - Crítico para responsividade móvel.
- **Open Graph (OG)**: `og:title`, `og:description`, `og:image`.
  - Para compartilhamento social.

## 2. Hierarquia de Cabeçalhos (H1-H3)

Verifique a estrutura semântica do conteúdo:

- **H1**:
  - **Obrigatório**: Apenas UM `<h1>` por página.
  - Deve descrever o tópico principal da página.
- **H2**:
  - Usado para seções principais.
- **H3**:
  - Usado para subseções dentro de H2.
- **Ordem**:
  - Não pule níveis (ex: H1 -> H3).

## 3. Textos Alternativos (Alt Text) em Imagens

Verifique todas as tags `<img>`:

- **Atributo `alt`**:
  - **Obrigatório** em todas as imagens informativas.
  - Deve descrever a imagem e sua função.
  - Para imagens puramente decorativas, use `alt=""` (vazio), mas o atributo deve existir.
  - Evite "imagem de...", "foto de...".

## 4. Presença de Sitemap

Verifique a existência e estrutura do arquivo de sitemap:

- **Localização Padrão**: Geralmente em `/sitemap.xml`.
- **Conteúdo**:
  - Deve listar todas as URLs públicas e relevantes.
  - Deve ser XML válido.
- **Robots.txt**:
  - Verifique se o sitemap está referenciado no `robots.txt`.

## Checklist de Execução

Ao realizar uma auditoria, gere um relatório com os seguintes itens:

- [ ] Status das Meta Tags (Title, Description, etc.)
- [ ] Validação da estrutura de Headers (H1 único, hierarquia)
- [ ] Análise de Alt Text em imagens (com exemplos de falhas, se houver)
- [ ] Verificação de Sitemap (existência e acessibilidade)

## Exemplo de Relatório

```markdown
### Relatório de Auditoria SEO: [Nome da Página]

**1. Meta Tags**
- ✅ Title: "..." (55 chars)
- ⚠️ Description: Ausente. Recomenda-se adicionar.

**2. Headers**
- ✅ H1 Único encontrado.
- ❌ H3 utilizado logo após H1 (pulo de hierarquia).

**3. Imagens**
- ❌ 2 imagens sem atributo alt. (logo.png, banner.jpg)

**4. Sitemap**
- ✅ Encontrado em /sitemap.xml
```
