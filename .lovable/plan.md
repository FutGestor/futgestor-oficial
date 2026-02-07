

# Redesign Premium Dark da Landing Page FutGestor

## Resumo

Aplicar a estetica escura e premium do template HTML enviado (fundo `#0A1628`, tipografia Bebas Neue, cards semi-transparentes, efeitos de glow) em toda a Landing Page, **mantendo inalterados**:
- O conteudo e estrutura atual da **PricingSection** (precos, features, textos)
- Os textos e copys existentes em cada secao
- Os links dos botoes (scroll para `#precos`, `/auth`, `/auth?tab=signup&redirect=onboarding`)

Somente a estetica visual sera alterada para o estilo dark/premium.

---

## Mudancas por Secao

### 1. Fontes (index.html + tailwind.config.ts)
- Adicionar link para Google Fonts: **Bebas Neue** e **DM Sans**
- Configurar `fontFamily.display: ['Bebas Neue']` no Tailwind
- Atualizar `fontFamily.sans` para incluir DM Sans como primeira opcao

### 2. LandingPage.tsx
- Envolver tudo em um container escuro `bg-[#0A1628] text-white`
- Adicionar novas secoes na composicao: LandingHeader, PainSection, FeaturesGrid, HowItWorks, TestimonialsSection, CtaFinal
- Remover imports de ZigZagFeatures e GallerySection

### 3. LandingHeader (Novo)
- Header fixo no topo com backdrop-blur e fundo semi-transparente escuro
- Logo FutGestor + texto "FutGestor" (Bebas Neue)
- Links de navegacao: Funcionalidades, Como funciona, Precos, FAQ
- Botao CTA dourado "Comecar gratis" (scroll para `#precos`)
- Menu hamburger no mobile

### 4. HeroSection (Redesign estetico)
- Fundo escuro com gradiente radial animado (glow azul/dourado sutil)
- Badge dourado: "Novo — Gestao esportiva simplificada"
- Titulo em Bebas Neue grande: "CHEGA DE BAGUNA NO WHATSAPP"
- Subtitulo: manter texto atual
- Botao "Criar meu time gratis" (scroll para `#precos`) + "Ver funcionalidades" (scroll)
- Stats row: "100% Gratuito pra comecar" | "2min Pra configurar" | "24/7 Acesso pelo celular"

### 5. PainSection (Nova)
- Grid 2 colunas: lista de dores (borda vermelha esquerda) + card solucao (borda dourada)
- Dores: grupo bagunçado, planilha, caixinha sem controle, escalacao na hora
- Solucao: "E se tudo isso tivesse em um so lugar?" com botao scroll para precos

### 6. FeaturesGrid (Nova — substitui ZigZagFeatures)
- Grid de 6 cards com fundo semi-transparente (`rgba(15, 36, 64, 0.6)`)
- Borda sutil, barra dourada no topo ao hover, translateY no hover
- Emojis como icones: Agenda, Escalacao, Elenco, Financeiro, Resultados, Avisos
- Tag "FUNCIONALIDADES" + titulo "TUDO QUE SEU TIME PRECISA"

### 7. HowItWorks (Nova)
- 4 passos em grid: Crie conta, Cadastre time, Adicione jogadores, Gerencie tudo
- Numeros grandes em Bebas Neue com opacidade reduzida
- Setas entre passos (ocultas no mobile)

### 8. PricingSection — SEM ALTERACOES
- Manter o componente exatamente como esta (conteudo, precos, features, botoes)
- Apenas garantir que o id="precos" esta presente (ja esta)

### 9. TestimonialsSection (Nova)
- Grid de 3 cards com estrelas douradas e depoimentos ficticios
- Fundo escuro semi-transparente, bordas sutis

### 10. FaqSection (Redesign estetico)
- Manter todas as perguntas e respostas atuais
- Aplicar estilo escuro: fundo semi-transparente, textos claros
- Tag "DUVIDAS FREQUENTES" + titulo em Bebas Neue

### 11. CtaFinal (Nova)
- Secao de fechamento com glow radial dourado
- Titulo: "SEU TIME MERECE ORGANIZACAO DE VERDADE"
- Botao CTA para cadastro

### 12. LandingFooter (Redesign estetico)
- Manter links atuais (Login, Cadastro, Termos de Uso)
- Estilo escuro com borda sutil no topo
- Logo + copyright

### 13. index.css
- Adicionar classe utilitaria `.landing-noise` para textura sutil de fundo (opcional)

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/PainSection.tsx`
- `src/components/landing/FeaturesGrid.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/TestimonialsSection.tsx`
- `src/components/landing/CtaFinal.tsx`

### Arquivos a editar:
- `src/pages/LandingPage.tsx` — nova composicao
- `src/components/landing/HeroSection.tsx` — redesign estetico completo
- `src/components/landing/FaqSection.tsx` — estilo escuro, manter conteudo
- `src/components/landing/LandingFooter.tsx` — estilo escuro, manter links
- `tailwind.config.ts` — fontFamily display, keyframe heroGlow
- `index.html` — link Google Fonts Bebas Neue + DM Sans

### Arquivos que NAO serao alterados:
- `src/components/landing/PricingSection.tsx` — mantida como esta

### Arquivos que podem ser removidos do uso:
- `src/components/landing/ZigZagFeatures.tsx` — nao sera mais importado
- `src/components/landing/GallerySection.tsx` — nao sera mais importado

### Navegacao dos botoes (mantida):
- Hero CTA principal: scroll suave para `#precos`
- Header "Comecar gratis": scroll suave para `#precos`
- Cards de preco "Assinar Agora": Link para `/auth?tab=signup&redirect=onboarding`
- "Entrar" / "Login": Link para `/auth`

