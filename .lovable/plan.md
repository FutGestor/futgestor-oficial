

# Substituir logo SVG e icones Shield pela imagem PNG do FutGestor

## O que sera feito

A imagem enviada (bola + engrenagem) sera salva como PNG com fundo transparente e usada como logo oficial do FutGestor em todos os locais do site onde atualmente aparece o icone generico Shield ou o componente SVG inline `FutGestorLogo`.

## Locais que serao atualizados

1. **Header (navbar)** - `src/components/layout/Header.tsx`: Substituir o `Shield` pelo logo PNG quando nao houver escudo de time configurado
2. **Footer** - `src/components/layout/Footer.tsx`: Substituir o `Shield` pelo logo PNG quando nao houver escudo de time
3. **Landing Page (hero)** - `src/pages/Index.tsx`: Substituir `FutGestorLogo` SVG pela imagem PNG
4. **Tela de Login** - `src/pages/Auth.tsx`: Substituir `FutGestorLogo` pela imagem PNG
5. **Onboarding** - `src/pages/Onboarding.tsx`: Substituir `FutGestorLogo` pela imagem PNG
6. **Admin Sidebar** - `src/pages/Admin.tsx`: Substituir `FutGestorLogo` em 3 locais (sidebar, loading, acesso negado)
7. **Pagina publica do time** - `src/pages/TeamPublicPage.tsx`: Substituir onde `FutGestorLogo` for usado
8. **Favicon** - `public/favicon.png` e `index.html`: Atualizar favicon com a nova imagem

## Detalhes tecnicos

### Arquivos de imagem
- Salvar `user-uploads://c8f7fe52-cf26-4812-81fe-a8ffa33901c1.png` como `src/assets/logo-futgestor.png` e `public/logo-futgestor.png`
- Atualizar `public/favicon.png` com a mesma imagem

### Abordagem
- Importar a imagem via ES module nos componentes React: `import logoFutgestor from "@/assets/logo-futgestor.png"`
- Usar `<img src={logoFutgestor} alt="FutGestor" className="h-12 w-12 object-contain" />` no lugar dos icones
- Ajustar tamanhos conforme o contexto (h-12 no header, h-20 no hero, h-10 no footer, h-16 no auth/onboarding, h-10 no admin sidebar)
- O componente `FutGestorLogo.tsx` sera mantido mas atualizado para renderizar a imagem PNG em vez do SVG inline
- Os `Shield` usados como icone de times/admin (ex: AdminTimes, AdminJogos, AdminUsuarios) NAO serao alterados — esses sao icones contextuais de escudo de time, nao o logo FutGestor

