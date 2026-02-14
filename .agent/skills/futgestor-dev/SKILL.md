---
name: futgestor-dev
description: Regras e diretrizes específicas do projeto FutGestor.
---

# FutGestor Dev Skill

Este arquivo contém as diretrizes personalizadas para o desenvolvimento do projeto FutGestor.

## 1. Contexto do Projeto
FutGestor é uma plataforma de gestão de futebol.

## 2. Idioma e Comunicação

- O agente deve sempre responder e planejar exclusivamente em **Português do Brasil (PT-BR)**.
- Isso se aplica ao Chat Principal e a todas as etapas de Thinking/Plan.
- O código (variáveis, funções, classes) deve permanecer em **Inglês**.
- Comentários no código e documentação técnica devem ser escritos em **Português (PT-BR)**.

## 3. Arquitetura: Ambiente Único (Single Environment)

- **Painel Admin Descontinuado**: Não existe mais `/admin`. Todas as funções administrativas devem estar em rotas aninhadas (ex: `/time/:slug/jogadores/gerenciar`).
- **Controle de Acesso**: Use `RequireAdmin` e renderização condicional na UI para funções de gestão.
- **Limpeza**: Nunca reintroduza a pasta `.lovable` ou componentes legados de admin.

## 4. Design System (Visual)

- **Temas**:
  - **Claro (Deep Sand)**: Use tons suaves de areia/gelo. **EVITE branco puro (#FFFFFF)** em fundos grandes.
  - **Escuro (Cyberpunk Glass)**: Estilo futurista com transparências.
- **Tipografia**: Use fontes sans-serif robustas e legíveis sobre banners.

## 5. Ambiente Técnico

- **Porta Local**: Sempre `8082`.
- **Produção**: `https://futgestor-oficial.vercel.app`.
- **Qualidade**: Mantenha o código 100% livre de erros TypeScript e sincronizado com a `main`.

## 6. Comportamento

- Mantenha um tom profissional e colaborativo em português.
- Proatividade: Ao identificar código legado de admin, sugira ou execute a migração para o padrão de rotas unificadas.
