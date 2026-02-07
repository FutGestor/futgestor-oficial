

# Resolver Conflito de Slug no Onboarding

## Problema

O slug (URL do time) e gerado automaticamente a partir do nome. Como no Brasil existem muitos times com nomes iguais (ex: "Galaticos", "Real", "Barcelona"), o slug colide e o usuario recebe "Slug ja em uso" sem saber o que fazer.

## Solucao

Adicionar um campo **Cidade** ao formulario de onboarding e usar cidade + nome para gerar o slug automaticamente, reduzindo drasticamente as colisoes. Alem disso, implementar verificacao em tempo real e sugestoes automaticas caso ainda haja conflito.

### Fluxo novo:
1. Usuario digita "Galaticos" no nome
2. Usuario digita "Recife" na cidade
3. Slug gerado automaticamente: `galaticos-recife`
4. Se ainda existir conflito, o sistema sugere alternativas: `galaticos-recife-01`, `galaticos-recife-02`
5. Indicador visual (verde/vermelho) mostra em tempo real se o slug esta disponivel

## Detalhes Tecnicos

### Arquivo editado: `src/pages/Onboarding.tsx`

**Mudancas:**
- Adicionar campo `cidade` ao schema Zod e ao formulario
- Alterar `handleNomeChange` para gerar slug como `nome-cidade` (quando cidade preenchida)
- Adicionar handler `handleCidadeChange` que tambem regenera o slug
- Adicionar verificacao async de disponibilidade do slug (debounced, consulta tabela `teams`)
- Mostrar indicador visual: icone verde "Disponivel" ou vermelho "Em uso" + sugestoes
- Se conflito, gerar e exibir ate 3 slugs alternativos clicaveis
- Salvar a cidade no campo `cidade` da tabela `times` (time da casa criado no onboarding)

### Verificacao de disponibilidade:
- Query simples: `supabase.from('teams').select('slug').eq('slug', valor).maybeSingle()`
- Executada com debounce de 500ms apos o usuario parar de digitar
- Resultado mostrado como badge ao lado do campo slug

### Sugestoes automaticas de slug:
- Se `galaticos-recife` estiver em uso, sugerir: `galaticos-recife-01`, `galaticos-recife-02`, `galaticos-recife-fc`
- Sugestoes aparecem como chips/botoes clicaveis abaixo do campo

### Campo cidade:
- Input simples com placeholder "Ex: Recife"
- Posicionado entre o campo Nome e o campo URL
- Obrigatorio (min 2 caracteres)

### Nenhuma migration necessaria:
- A tabela `times` ja possui o campo `cidade` (text, nullable)
- O campo sera preenchido ao criar o time da casa no onboarding

