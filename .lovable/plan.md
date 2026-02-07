
# Redesign Premium da Landing Page FutGestor

## O que o FutGestor faz (para contexto do redesign)

O FutGestor e uma plataforma SaaS de gestao para times de futebol amador. Ele oferece:
- **Gestao Financeira**: Controle de caixa, mensalidades, quem pagou e quem deve
- **Escalacao Tatica**: Campo virtual interativo para montar formacoes (5x5, 7x7, 11x11) e compartilhar no WhatsApp
- **Agenda de Jogos**: Calendario com datas, horarios e locais dos jogos
- **Ranking e Estatisticas**: Artilharia, assistencias, presenca dos jogadores
- **Portal do Jogador**: Cada atleta tem login proprio para ver dividas, confirmar presenca e acompanhar stats
- **Avisos Automaticos**: Comunicacao direta com o elenco
- **Pagina Publica do Time**: Vitrine com escudo, resultados e informacoes do time

O publico-alvo e o **capitao/organizador** do time que hoje gerencia tudo pelo WhatsApp e caderno.

---

## Mudancas Planejadas

### 1. Hero Section - Impacto Premium
- Botao principal "Ver Planos" faz **scroll suave** para a secao `#precos` (em vez de ir para cadastro)
- Botao secundario "Entrar" (link discreto para `/auth`)
- Gradiente com blur na imagem de fundo para efeito mais sofisticado
- Animacao de fade-in no titulo e botoes

### 2. Secao de Funcionalidades - Layout Zigue-Zague
Substituir os 3 cards simples por blocos alternados (texto + imagem lado a lado):
- **Bloco 1** (Texto esquerda / Screenshot direita): "O Fim do Calote" - screenshot financeiro
- **Bloco 2** (Screenshot esquerda / Texto direita): "Escalacao Profissional" - screenshot escalacao
- **Bloco 3** (Texto esquerda / Screenshot direita): "Cada Atleta com seu Acesso" - screenshot ranking/avisos

Cada bloco tera titulo grande, texto persuasivo detalhado e imagem com sombra e bordas arredondadas.

### 3. Galeria Interativa "Por Dentro do App"
- Grid de miniaturas das 6 screenshots existentes
- **Ao clicar**: abre um Dialog/Modal (lightbox) com a imagem em tamanho grande
- Efeito hover com zoom sutil nas miniaturas
- Fundo escuro (navy) para contraste

### 4. Secao de Planos (id="precos")
- ID mudado de `planos` para `precos` (ancora do botao do hero)
- Card Pro com borda dourada brilhante e escala maior
- Itens inclusos com Check verde; itens nao inclusos com X cinza nos planos inferiores
- Destaque "Login para Jogadores: INCLUSO" no plano Liga

### 5. FAQ Premium
- Cards com bordas arredondadas (rounded-xl) e sombras suaves
- Fundo card branco sobre fundo muted para profundidade
- Animacao suave ja existente no accordion

### 6. Animacoes de Entrada
- Usar a classe `animate-fade-in` existente no Tailwind config com **Intersection Observer** nativo
- Cada secao aparece com fade-in ao entrar na viewport
- Sem dependencia externa (sem framer-motion)

---

## Detalhes Tecnicos

### Arquivo editado:
- `src/pages/LandingPage.tsx` - Reescrita completa do componente

### Componentes utilizados:
- `Dialog` do Shadcn (para lightbox das screenshots)
- `Accordion` do Shadcn (FAQ)
- `Card`, `Badge`, `Button` do Shadcn
- Lucide icons: `DollarSign`, `Users`, `Smartphone`, `Check`, `X`, `Trophy`, `Shield`, `Star`, `ChevronRight`, `Eye`

### Hook customizado inline:
- `useInView` simples com `IntersectionObserver` para animacoes de scroll (implementado dentro do proprio componente, sem criar arquivo extra)

### Scroll suave:
```
document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })
```

### Nenhuma dependencia nova necessaria
- Tudo sera feito com Tailwind, Shadcn e APIs nativas do browser
