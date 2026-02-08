

# Jogos da Rodada + Emblemas Publicos + Link Super Admin

## Problema Identificado

A rota `/super-admin/vendas` foi criada mas nao existe nenhum link ou botao no site para acessa-la. O super admin so consegue chegar digitando a URL manualmente. Isso sera corrigido junto com as melhorias visuais solicitadas.

---

## 1. Link do Dashboard de Vendas no Sidebar Admin

### Arquivo: `src/pages/Admin.tsx`

Adicionar um item condicional no final do sidebar, visivel apenas para o super admin. A verificacao sera feita pelo email do usuario logado (`futgestor@gmail.com`).

- Icone: `TrendingUp` ou `DollarSign`
- Label: "Vendas SaaS"
- Link direto para `/super-admin/vendas`
- Aparece somente quando `user.email === "futgestor@gmail.com"`
- Visualmente separado dos demais itens (acima do email do usuario, na area inferior do sidebar)

---

## 2. Jogos da Rodada na Pagina Publica

### Novo componente: `src/components/LeagueRoundMatches.tsx`

Exibe os jogos agrupados por rodada com:
- Escudo + nome do time casa
- Placar centralizado (bold) ou badge "vs" se agendado
- Escudo + nome do time visitante
- Seletor de rodada (Select ou tabs)

### Arquivo modificado: `src/pages/TeamPublicPage.tsx`

Atualizar o card de cada campeonato para layout responsivo:

**Desktop (lg+)**: Grid com classificacao a esquerda e jogos da rodada a direita (lado a lado, conforme o print de referencia)

**Mobile/Tablet**: Classificacao em cima, jogos da rodada empilhados abaixo

---

## 3. Emblemas Publicos na Agenda

### Migracao SQL

Adicionar politica de leitura publica na tabela `times` para que visitantes vejam os escudos dos times adversarios:

```sql
CREATE POLICY "Public can view times" ON public.times
  FOR SELECT USING (true);
```

O codigo frontend da Agenda (`src/pages/Agenda.tsx`) ja faz o join com `time_adversario:times(*)` e ja renderiza o escudo. A unica barreira e o RLS, que sera resolvido com essa politica.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Politica publica em `times` |
| `src/components/LeagueRoundMatches.tsx` | Novo componente |
| `src/pages/TeamPublicPage.tsx` | Layout lado-a-lado com jogos |
| `src/pages/Admin.tsx` | Link condicional para Super Admin |

