

# Ajustes na Hero Section da Pagina Publica

## Problemas identificados

1. **Logo FutGestor aparecendo na hero** -- precisa ser removida quando nao ha escudo do time
2. **Capa/banner desfocada** -- o gradiente overlay esta muito opaco, escurecendo e desfocando a imagem
3. **Botoes de redes sociais** -- precisam aparecer na hero section (ao lado do "Ver Agenda") como na segunda imagem, e so quando configurados
4. **Marca d'agua "FutGestor" grande** -- parece estar aparecendo por tras (provavelmente o logo grande no fundo)

## Mudancas

### 1. `src/pages/TeamPublicPage.tsx`

- **Remover o logo/escudo** da hero section (remover o bloco condicional que exibe `team.escudo_url` ou `FutGestorLogo`)
- **Reduzir opacidade do gradiente overlay** para que a imagem de fundo fique nitida e clara (mudar de `from-primary/90 via-primary/80` para algo como `from-black/50 via-black/40 to-black/30`)
- **Adicionar botoes de redes sociais na hero**, ao lado do botao "Ver Agenda":
  - Botao Instagram (branco com icone) -- so aparece se `team.redes_sociais.instagram` existir
  - Botao WhatsApp (verde com icone) -- so aparece se `team.redes_sociais.whatsapp` existir
  - Botao YouTube -- so aparece se `team.redes_sociais.youtube` existir
  - Botao Facebook -- so aparece se `team.redes_sociais.facebook` existir
- Estilo dos botoes conforme a segunda imagem: Instagram com fundo branco/outline, WhatsApp com fundo verde

### 2. Detalhes tecnicos

No componente `TeamPublicPage`, dentro da hero section:

- Remover linhas 250-254 (bloco do escudo/FutGestorLogo)
- Alterar o gradiente overlay de `from-primary/90 via-primary/80 to-accent/40` para `from-black/50 via-black/40 to-black/20` para manter nitidez
- Remover o segundo overlay com radial-gradient
- Adicionar na area de botoes (flex wrap) os botoes condicionais de redes sociais com links externos (`target="_blank"`)

Arquivos editados:
- `src/pages/TeamPublicPage.tsx`

