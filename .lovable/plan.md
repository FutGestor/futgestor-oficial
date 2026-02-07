

# Revisao de CTAs e Textos da Landing Page

## Problema Identificado

O site menciona "gratis" em varios lugares, mas na pratica o usuario precisa de um plano pago (a partir de R$ 9,90/mes) para usar qualquer funcionalidade do painel. Isso gera frustacao e confusao. Alem disso, faltam explicacoes mais detalhadas sobre a plataforma nos CTAs.

## Locais com "gratis" que serao corrigidos

| Arquivo | Texto atual | Novo texto |
|---|---|---|
| **LandingHeader** (botao CTA) | "Comecar gratis" | "Conhecer planos" |
| **HeroSection** (botao principal) | "Criar meu time gratis" | "Comecar agora" |
| **HeroSection** (stat "100%") | "100% / Gratuito pra comecar" | "A partir de / R$ 9,90/mes" |
| **HowItWorks** (passo 01) | "Sem cartao de credito." | "Rapido e simples." |
| **CtaFinal** (botao) | "Criar meu time agora — e gratis" | "Criar meu time agora" |

## Melhorias no conteudo dos CTAs

### HeroSection — Subtitulo mais explicativo
**Atual:** "Abandone o caderno e a confusao no WhatsApp. Financeiro, Escalacao, Estatisticas e Area do Jogador — tudo em um so lugar."

**Novo:** "A plataforma completa para gerenciar seu time de futebol amador. Controle financeiro, escalacao tatica no campo virtual, ranking de jogadores, agenda de jogos e portal exclusivo para cada atleta — tudo acessivel pelo celular."

### HeroSection — Adicionar subtexto abaixo dos botoes
Novo elemento entre os botoes e os stats:
- Texto pequeno: "Planos a partir de R$ 9,90/mes — Sem fidelidade, cancele quando quiser"

### CtaFinal — Mais contexto sobre a plataforma
Transformar de secao simples para secao mais rica com:
- Titulo mantido: "SEU TIME MERECE ORGANIZACAO DE VERDADE"
- Subtitulo expandido com 3 mini-destaques em grid (icones + texto curto):
  - "Agenda, escalacao e resultados organizados"
  - "Financeiro transparente para todo o elenco"
  - "Acesso pelo celular, sem instalar nada"
- Texto: "Planos a partir de R$ 9,90/mes"
- Botao: "Criar meu time agora"

### HowItWorks — Ajustar passo 2 (escudo)
**Atual passo 02:** "Nome, escudo e pronto. Seu time tem um portal proprio."
**Novo passo 02:** "Nome do time e pronto. Seu time ganha um portal exclusivo. Personalize com escudo e cores depois."

Isso alinha com a realidade de que o upload de escudo pode nao funcionar no cadastro inicial.

## Detalhes Tecnicos

### Arquivos a editar:
- `src/components/landing/LandingHeader.tsx` — texto do botao CTA
- `src/components/landing/HeroSection.tsx` — botao, subtitulo, stats, novo subtexto
- `src/components/landing/HowItWorks.tsx` — textos dos passos 01 e 02
- `src/components/landing/CtaFinal.tsx` — secao expandida com mini-destaques

### Arquivos que NAO serao alterados:
- `src/components/landing/PricingSection.tsx` — mantida como esta
- Todos os demais componentes da landing

### Nenhuma dependencia nova necessaria

