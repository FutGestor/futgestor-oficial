

# Configuracoes do Time no Admin + Gestao de Planos

## Resumo

Criar uma nova pagina de **Configuracoes** no painel admin onde o administrador pode:
1. Fazer upload de uma foto de capa/banner para a hero section da pagina publica
2. Editar nome do time e informacoes basicas (ja existentes)
3. Gerenciar redes sociais (Instagram, YouTube, Facebook, WhatsApp)
4. Visualizar e gerenciar o plano de assinatura (upgrade, downgrade, cancelar)

## O que muda para o usuario

- Nova opcao **"Configuracoes"** no menu lateral do admin (com icone de engrenagem)
- Formulario com upload de imagem de capa que aparece no fundo da hero section da pagina publica do time
- Campos para adicionar links de redes sociais (Instagram, YouTube, Facebook, WhatsApp) -- so aparecem na pagina publica os que forem preenchidos
- Secao "Meu Plano" movida para dentro do admin, mostrando o plano atual com opcoes de assinar/cancelar

## Detalhes tecnicos

### 1. Migracao de banco de dados

- Adicionar coluna `banner_url text` na tabela `teams` para armazenar a URL da foto de capa

### 2. Nova pagina admin: `src/pages/admin/AdminConfiguracoes.tsx`

Secoes:
- **Identidade do Time**: Upload de escudo + upload de banner/capa, nome do time
- **Redes Sociais**: Campos para Instagram, YouTube, Facebook e WhatsApp (salva no campo `redes_sociais` jsonb existente)
- **Meu Plano**: Componente `MeuPlanoSection` (ja existente) integrado aqui

### 3. Upload de banner

- Usar o bucket `times` que ja existe no storage
- Salvar a imagem como `{team_id}/banner.{ext}` no bucket
- Atualizar `teams.banner_url` com a URL publica

### 4. Hero section da pagina publica (`TeamPublicPage.tsx`)

- Usar `team.banner_url` como `background-image` da hero section (se existir)
- Manter o gradiente como overlay semi-transparente sobre a foto

### 5. Atualizar navegacao do admin (`Admin.tsx`)

- Adicionar item "Configuracoes" no menu lateral com icone Settings
- Adicionar rota `/admin/configuracoes` apontando para o novo componente

### 6. Atualizar hooks

- Adicionar `banner_url` ao `useTeamConfig` e `useTeamSlug`
- Adicionar `youtube` e `facebook` ao tipo `redes_sociais`

### Arquivos modificados/criados

- **Novo**: `src/pages/admin/AdminConfiguracoes.tsx`
- **Migracao SQL**: adicionar `banner_url` a `teams`
- **Editado**: `src/pages/Admin.tsx` (nova rota + menu)
- **Editado**: `src/pages/TeamPublicPage.tsx` (banner na hero)
- **Editado**: `src/hooks/useTeamConfig.ts` (banner_url + redes sociais expandidas)
- **Editado**: `src/hooks/useTeamSlug.tsx` (banner_url)
- **Editado**: `src/components/layout/Footer.tsx` (youtube, facebook)

