# Plano de Correção - Persistência de Modalidades

## ✅ Problema Identificado

O `Onboarding.tsx` estava salvando as informações de **modalidade**, **faixa_etaria** e **gênero** apenas na tabela `times` (entidade esportiva), mas **NÃO** na tabela `teams` (SaaS).

Como o `Discovery.tsx` e `TeamProfile.tsx` consultam a tabela `teams`, os dados apareciam vazios, caindo nos fallbacks hardcoded ("Society 7x7", "Livre").

---

## ✅ Correções Aplicadas

### 1. Banco de Dados
**Arquivo:** `supabase/migrations/20250221100000_add_team_classification.sql`

```sql
-- Adicionar colunas à tabela teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS modalidade TEXT,
ADD COLUMN IF NOT EXISTS faixa_etaria TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_teams_modalidade ON public.teams(modalidade);
CREATE INDEX IF NOT EXISTS idx_teams_faixa_etaria ON public.teams(faixa_etaria);
CREATE INDEX IF NOT EXISTS idx_teams_genero ON public.teams(genero);

-- Migrar dados existentes
UPDATE public.teams t
SET 
  modalidade = tm.modalidade,
  faixa_etaria = tm.faixa_etaria,
  genero = tm.genero
FROM public.times tm
WHERE t.id = tm.team_id 
  AND tm.is_casa = true;
```

### 2. Frontend - Onboarding.tsx
**Mudança:** Incluir campos no insert da tabela `teams`

```typescript
const { data: team, error: teamError } = await supabase
  .from("teams")
  .insert({ 
    nome: data.nome, 
    slug: data.slug,
    escudo_url: data.escudo_url,
    cidade: data.cidade,
    estado: data.uf,
    modalidade: data.modalidade,        // ✅ NOVO
    faixa_etaria: data.faixa_etaria,    // ✅ NOVO
    genero: data.genero                 // ✅ NOVO
  })
  .select()
  .single();
```

### 3. Frontend - Discovery.tsx
**Mudança:** Remover fallbacks hardcoded, mostrar apenas se tiver dados

```tsx
// Antes:
<span>{team.modalidade || "Society 7x7"}</span>
<span>{team.faixa_etaria || "Livre"}</span>

// Depois:
{team.modalidade && (
  <span>{team.modalidade}</span>
)}
{team.faixa_etaria && (
  <span>{team.faixa_etaria}</span>
)}
```

### 4. Types - types.ts
**Mudança:** Atualizar interface da tabela `teams`

```typescript
teams: {
  Row: {
    // ... campos existentes
    cidade: string | null        // ✅ ADICIONADO
    estado: string | null        // ✅ ADICIONADO
    modalidade: string | null    // ✅ ADICIONADO
    faixa_etaria: string | null  // ✅ ADICIONADO
    genero: string | null        // ✅ ADICIONADO
    ativo: boolean | null        // ✅ ADICIONADO
  }
  // ... Insert e Update também atualizados
}
```

---

## 📝 Passos para Aplicar

1. **Executar migração no Supabase:**
   ```sql
   -- Copiar conteúdo de:
   supabase/migrations/20250221100000_add_team_classification.sql
   ```

2. **Testar criação de novo time:**
   - Acessar `/onboarding`
   - Criar time com modalidade "Campo 11x11", "Sub-20", "Feminino"
   - Verificar se aparece corretamente no `/explorar`

3. **Verificar times existentes:**
   - Os dados serão migrados automaticamente da tabela `times`
   - Verificar no Supabase: `SELECT nome, modalidade FROM teams`

---

## ✅ Validação

| Cenário | Esperado |
|---------|----------|
| Novo time criado | Modalidade salva em `teams` |
| Discovery | Mostra modalidade real (sem fallback) |
| TeamProfile | Mostra modalidade real |
| Times antigos | Dados migrados de `times` |

---

## 🔄 Notas

- A tabela `times` continua existindo para compatibilidade
- Novos dados são salvos em ambas as tabelas
- Migração unidirecional: `times` → `teams` (apenas `is_casa = true`)
