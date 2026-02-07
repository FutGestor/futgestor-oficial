
# Sistema de Confirmacao de Presenca por Link Privado

## Resumo
Criar um sistema onde o admin gera um link unico por jogo (ex: `/presenca/abc12345`), compartilha no WhatsApp, e os jogadores confirmam presenca sem precisar de login. O admin visualiza o resumo das confirmacoes no painel.

## 1. Banco de Dados

### Tabela `presenca_links`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, default gen_random_uuid() |
| jogo_id | uuid | FK para jogos, UNIQUE |
| team_id | uuid | FK para teams |
| codigo | text | UNIQUE, 8 caracteres aleatorios |
| created_at | timestamptz | default now() |

### Tabela `presencas`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, default gen_random_uuid() |
| presenca_link_id | uuid | FK para presenca_links |
| jogador_id | uuid | FK para jogadores |
| status | text | 'confirmado' ou 'ausente' |
| updated_at | timestamptz | default now() |
| UNIQUE | | (presenca_link_id, jogador_id) |

### Politicas RLS
- **presenca_links**: SELECT publico (anon) para permitir acesso via link. INSERT/UPDATE/DELETE apenas para team admins.
- **presencas**: SELECT e UPSERT publico (anon) para jogadores confirmarem sem login. DELETE apenas para team admins. Admin tambem pode inserir/atualizar.

## 2. Rota Nova no App

Adicionar rota publica fora do layout `/time/:slug`:
```text
<Route path="/presenca/:codigo" element={<PresencaPublica />} />
```
Essa rota nao aparece em nenhuma navegacao -- so acessivel por quem tem o link.

## 3. Pagina Publica (`/presenca/:codigo`)

Nova pagina `src/pages/PresencaPublica.tsx`:
- Busca o `presenca_link` pelo codigo, carrega dados do jogo (adversario, data, horario, local) e lista de jogadores do time.
- Exibe info do jogo no topo.
- Lista todos os jogadores. Ao clicar no nome, abre opcoes: "Vou jogar" ou "Nao vou".
- Faz upsert na tabela `presencas`.
- Mostra mensagem de sucesso apos confirmar.
- NAO mostra respostas de outros jogadores.

## 4. Botao "Link de Presenca" no Admin

No componente `JogoCard` dentro de `AdminJogos.tsx`:
- Adicionar botao com icone de link (Link2).
- Ao clicar, verifica se ja existe `presenca_link` para o jogo. Se nao, cria com codigo aleatorio de 8 chars.
- Mostra dialog com o link completo e botao "Copiar link".
- Hook `usePresencaLink(jogoId)` para buscar/criar o link.

## 5. Painel Admin de Presencas (melhorar existente)

O `AdminPresencaManager` existente usa a tabela `confirmacoes_presenca`. A nova feature usa a tabela `presencas` (via link). Vou adicionar uma aba ou secao no dialog de presencas mostrando:
- Resumo: X confirmados, X ausentes, X sem resposta (baseado na tabela `presencas`).
- Lista de jogadores com status.
- Admin pode marcar presenca manualmente (upsert na tabela `presencas`).

## Detalhes Tecnicos

### Migracao SQL
```text
-- Tabela presenca_links
CREATE TABLE public.presenca_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id),
  codigo text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(jogo_id)
);
ALTER TABLE public.presenca_links ENABLE ROW LEVEL SECURITY;

-- Tabela presencas
CREATE TABLE public.presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presenca_link_id uuid NOT NULL REFERENCES public.presenca_links(id) ON DELETE CASCADE,
  jogador_id uuid NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('confirmado', 'ausente')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(presenca_link_id, jogador_id)
);
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- RLS: presenca_links
CREATE POLICY "Public can read presenca_links by codigo"
ON public.presenca_links FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Team admins can manage presenca_links"
ON public.presenca_links FOR ALL TO authenticated
USING (is_team_admin(auth.uid(), team_id));

-- RLS: presencas
CREATE POLICY "Public can read own presenca"
ON public.presencas FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can upsert presencas"
ON public.presencas FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update presencas"
ON public.presencas FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Team admins can delete presencas"
ON public.presencas FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM presenca_links pl
  WHERE pl.id = presencas.presenca_link_id
  AND is_team_admin(auth.uid(), pl.team_id)
));
```

### Arquivos a criar
- `src/pages/PresencaPublica.tsx` -- Pagina publica de confirmacao
- `src/hooks/usePresencaLink.ts` -- Hook para buscar/criar link de presenca

### Arquivos a modificar
- `src/App.tsx` -- Adicionar rota `/presenca/:codigo`
- `src/pages/admin/AdminJogos.tsx` -- Adicionar botao de link no JogoCard e dialog de copia
- `src/components/AdminPresencaManager.tsx` -- Adicionar secao mostrando respostas da tabela `presencas` (via link)
- `src/lib/types.ts` -- Adicionar tipos PresencaLink e Presenca
