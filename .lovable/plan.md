

# Filtrar dados de Agenda e Resultados por time

## Problema

As queries de `useJogos()` e `useResultados()` nao filtram por `team_id`. Para membros logados, o RLS filtra automaticamente. Mas para visitantes anonimos, a policy publica usa `USING (true)`, retornando dados de TODOS os times.

## Solucao

Adicionar parametro opcional `teamId` aos hooks `useJogos()` e `useResultados()`, e passar o `team_id` do contexto do slug nas paginas Agenda e Resultados.

## Detalhes tecnicos

### 1. Hook `useJogos` (src/hooks/useData.ts)

Adicionar parametro opcional `teamId`:

```typescript
export function useJogos(teamId?: string) {
  return useQuery({
    queryKey: ["jogos", teamId],
    queryFn: async () => {
      let query = supabase.from("jogos").select(`*, time_adversario:times(*)`);
      if (teamId) {
        query = query.eq("team_id", teamId);
      }
      const { data, error } = await query.order("data_hora", { ascending: false });
      if (error) throw error;
      return data as Jogo[];
    },
  });
}
```

### 2. Hook `useResultados` (src/hooks/useData.ts)

Mesma abordagem:

```typescript
export function useResultados(teamId?: string) {
  return useQuery({
    queryKey: ["resultados", teamId],
    queryFn: async () => {
      let query = supabase.from("resultados").select(`*, jogo:jogos(*)`);
      if (teamId) {
        query = query.eq("team_id", teamId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Resultado & { jogo: Jogo })[];
    },
  });
}
```

### 3. Pagina Agenda (src/pages/Agenda.tsx)

Importar `useTeamConfig` e passar o `team.id` para `useJogos`:

```typescript
const { team } = useTeamConfig();
const { data: jogos, isLoading } = useJogos(team.id || undefined);
```

### 4. Pagina Resultados (src/pages/Resultados.tsx)

Ja importa `useTeamConfig`. Passar o `team.id` para `useResultados`:

```typescript
const { data: resultados, isLoading } = useResultados(team.id || undefined);
```

### 5. Verificar outros usos de useJogos/useResultados

Chamadas existentes sem parametro continuarao funcionando como antes (sem filtro extra, RLS protege para membros logados). Nenhuma quebra de compatibilidade.

### Arquivos modificados
- `src/hooks/useData.ts` (useJogos e useResultados aceitam teamId)
- `src/pages/Agenda.tsx` (passa team.id)
- `src/pages/Resultados.tsx` (passa team.id)
