

# Plano de Correções - FutGestor

## Problemas Identificados

### 1. Erro ao atualizar status do chamado (Super Admin)
O super admin nao consegue mudar o status dos chamados. A politica de UPDATE no banco exige `is_super_admin(auth.uid())` como USING, mas pode estar faltando um WITH CHECK explicito. Sera criada uma migracao para garantir que a politica de UPDATE funcione corretamente, adicionando WITH CHECK.

### 2. Sem notificacao visual de novos chamados para o Super Admin
O botao "Suporte Global" no Header nao mostra nenhum badge indicando chamados abertos. Sera adicionado um badge com a contagem de chamados com status "aberto" no botao do header (desktop e mobile).

### 3. Nome do time truncado no Header ("g...")
O nome do time aparece cortado no header. Como o nome ja aparece grande na secao hero abaixo, o nome do time sera removido do header, mantendo apenas o escudo/logo.

### 4. Logo do PWA com fundo preto
A logo do app instalado no celular ainda aparece com fundo preto. Sera substituida pela nova imagem transparente enviada (FutGestor.png), copiando para `public/logo-futgestor.png` e `src/assets/logo-futgestor.png`.

### 5. Logos dos clubes no calendario em formato quadrado
Os escudos dos times adversarios no calendario da agenda aparecem em quadrados. Serao alterados para exibicao circular com `rounded-full` e `overflow-hidden`, melhorando a aparencia visual.

---

## Detalhes Tecnicos

### Migracao SQL (Status do Chamado)
- Dropar a politica de UPDATE existente "Super admin atualiza chamados"
- Recriar com USING e WITH CHECK usando `is_super_admin(auth.uid())`
- Dropar e recriar "Usuário pode atualizar seus chamados" com WITH CHECK

### Header.tsx
- Remover o `<span>` com `teamName` da area do logo
- Adicionar hook `useTodosChamados` ou query simples para contar chamados abertos
- Exibir badge numerico no botao "Suporte Global" (desktop e mobile)

### TeamPublicPage.tsx
- Nas linhas 305-308, alterar a renderizacao do escudo no calendario para usar um container circular (`rounded-full overflow-hidden`) em vez de quadrado

### Logo PWA
- Copiar `user-uploads://FutGestor.png` para `public/logo-futgestor.png` e `src/assets/logo-futgestor.png`

### Arquivos Modificados
1. `supabase/migrations/` - Nova migracao para corrigir politicas UPDATE
2. `src/components/layout/Header.tsx` - Remover nome do time, adicionar badge chamados
3. `src/pages/TeamPublicPage.tsx` - Escudos circulares no calendario
4. `public/logo-futgestor.png` - Nova logo transparente
5. `src/assets/logo-futgestor.png` - Nova logo transparente
6. `src/hooks/useChamados.ts` - Adicionar hook para contar chamados abertos (para badge)

