

# Tornar Agenda e Resultados visíveis para visitantes

## Problema atual

As páginas Agenda e Resultados estão envolvidas pelo componente `RequireTeam`, que exige login. Além disso, as políticas de segurança do banco de dados só permitem leitura para membros do time. Visitantes veem "Acesso restrito".

## O que será feito

### 1. Banco de dados - Novas políticas de leitura pública

Criar políticas SELECT para as tabelas `jogos` e `resultados` que permitam leitura anônima filtrada por `team_id` (o visitante só vê dados do time cujo slug acessou):

- `jogos`: SELECT para role `anon` com filtro por `team_id`
- `resultados`: SELECT para role `anon` com filtro por `team_id`

### 2. Remover `RequireTeam` das páginas Agenda e Resultados

- **`src/pages/Agenda.tsx`**: Remover o wrapper `RequireTeam` do export, renderizar `AgendaContent` diretamente
- **`src/pages/Resultados.tsx`**: Remover o wrapper `RequireTeam` do export, renderizar `ResultadosContent` diretamente

### 3. Ocultar itens de navegação restritos para visitantes

- **`src/components/layout/Header.tsx`**: Separar os nav items em dois grupos:
  - Visíveis para todos: Início, Agenda, Resultados
  - Visíveis apenas para membros logados: Escalação, Jogadores, Ranking
  - Manter Financeiro e Avisos como já estão (apenas para logados)

### 4. Ajustar MobileBottomNav para visitantes

- **`src/components/layout/MobileBottomNav.tsx`**: Mostrar apenas Agenda e Resultados para visitantes não logados. Ranking e Avisos ficam restritos a membros.

### 5. Ocultar funcionalidades de membro nas páginas públicas

- Na página Agenda, esconder o botão de confirmação de presença (`ConfirmacaoPresenca`) quando o visitante não está logado
- Na página Resultados, esconder o componente `VotacaoDestaque` quando o visitante não está logado

## Detalhes técnicos

### Migration SQL
```sql
CREATE POLICY "Public can view jogos by team"
ON public.jogos FOR SELECT TO anon
USING (true);

CREATE POLICY "Public can view resultados by team"
ON public.resultados FOR SELECT TO anon
USING (true);
```

### Header - Lógica de nav items
```typescript
const visitorNavItems = [
  { href: basePath, label: "Início" },
  { href: `${basePath}/agenda`, label: "Agenda" },
  { href: `${basePath}/resultados`, label: "Resultados" },
];

const memberNavItems = [
  { href: `${basePath}/escalacao`, label: "Escalação" },
  { href: `${basePath}/jogadores`, label: "Jogadores" },
  { href: `${basePath}/ranking`, label: "Ranking" },
];
```

### Arquivos modificados
- Migration SQL (nova policy RLS)
- `src/pages/Agenda.tsx` (remover RequireTeam, esconder presença para anon)
- `src/pages/Resultados.tsx` (remover RequireTeam, esconder votação para anon)
- `src/components/layout/Header.tsx` (filtrar nav items por autenticação)
- `src/components/layout/MobileBottomNav.tsx` (filtrar itens para visitantes)

