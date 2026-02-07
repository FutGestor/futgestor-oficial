

# Landing Page Oficial do FutGestor + Pagina de Termos

## Visao Geral

Criar uma Landing Page profissional focada em conversao (SaaS) na rota `/` e uma pagina de Termos de Uso em `/termos`. A landing page substitui o Index atual, que apenas tinha um hero simples. Usuarios logados com time continuarao sendo redirecionados para a pagina do time.

---

## Estrutura da Landing Page (Index.tsx)

A pagina tera as seguintes secoes, todas em um unico componente (ou com sub-componentes internos):

### 1. Hero Section
- Fundo escuro (#1B3A5C) com a imagem hero existente (`hero-futgestor.png`) e overlay escuro
- Logo FutGestor (componente existente `FutGestorLogo`)
- Headline: "A Gestao Profissional que seu Time de Futebol Merece"
- Subheadline: "Abandone o caderno e a confusao no WhatsApp..."
- Botao CTA dourado grande: "Comecar Agora" (leva para `/auth?tab=signup&redirect=onboarding`)
- Botao secundario: "Ja tenho conta" (leva para `/auth`)

### 2. Problema vs Solucao (3 Cards)
- Fundo claro (#F8F9FA)
- Card 1: "Chega de Calote" - icone DollarSign - Painel Financeiro automatico
- Card 2: "Escalacao Sem Briga" - icone Users - Campo tatico virtual
- Card 3: "Area do Jogador" - icone Smartphone - Acesso proprio do atleta

### 3. Demonstracao (Screenshots)
- Grid responsivo mostrando 4-6 screenshots das telas do sistema como referencia visual
- As imagens dos screenshots serao copiadas para `src/assets/screenshots/` e importadas
- Titulo: "Veja o FutGestor em Acao"

### 4. Tabela de Planos (Pricing)
- 3 cards lado a lado (responsivo: empilhados no mobile)
- **Basico** R$ 9,90/mes - borda padrao
- **Pro** R$ 19,90/mes - TAG "MAIS POPULAR", borda dourada, destaque visual
- **Liga** R$ 39,90/mes - borda padrao
- Features listadas com checkmarks
- Todos os botoes "Assinar Agora" levam para `/auth`

### 5. FAQ (Accordion)
- 3 perguntas usando o componente Accordion do Shadcn
- Pagamento, Login de Jogadores, Society/Campo

### 6. Footer da Landing
- Footer proprio (nao o Footer do time) com:
  - Copyright 2026 FutGestor
  - Links: Login, Cadastro, Termos de Uso

---

## Pagina de Termos (/termos)

- Nova rota `/termos` no App.tsx
- Pagina simples com texto juridico padrao para SaaS
- Layout limpo com header FutGestor e voltar para home

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/LandingPage.tsx` - Landing page completa (substituira o conteudo do Index para visitantes)
- `src/pages/Termos.tsx` - Pagina de Termos de Uso
- Copiar ~6 screenshots selecionados para `src/assets/screenshots/`

### Arquivos a editar:
- `src/pages/Index.tsx` - Renderizar `LandingPage` para visitantes, manter redirect para usuarios logados
- `src/App.tsx` - Adicionar rota `/termos`

### Componentes utilizados:
- Shadcn: Card, Button, Accordion, Badge
- Lucide icons: DollarSign, Users, Smartphone, Check, ChevronRight, Trophy, Shield, Star
- FutGestorLogo existente
- Imagem hero existente (`hero-futgestor.png`)

### Screenshots selecionados (das imagens enviadas):
1. Agenda/Calendario (Screenshot_11)
2. Resultados publico (Screenshot_16)
3. Ranking/Artilharia (Screenshot_18)
4. Financeiro (Screenshot_19)
5. Escalacao/Estatisticas (Screenshot_15)
6. Avisos (Screenshot_20)

### Estilo:
- Cores do design system existente (navy, gold, cream) ja configuradas no Tailwind
- Botoes CTA usam classe customizada com bg dourado (#D4AF37) ou `bg-secondary`
- Secoes alternam entre fundo claro e escuro para ritmo visual
- Totalmente responsivo (mobile-first)
- Sem alterar o Footer ou Header do time (a landing page tera seu proprio footer inline)
