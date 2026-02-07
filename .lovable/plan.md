

# Correção: Criar Perfil de Jogador com team_id

## Problema
O erro "new row violates row-level security policy for table jogadores" ocorre porque o INSERT na tabela `jogadores` feito em `MeuPerfil.tsx` não inclui o `team_id` do usuário. A política RLS exige que `team_id = get_user_team_id()`.

## Correção

**Arquivo: `src/pages/MeuPerfil.tsx`**

1. Importar `useAuth` (já importado) e usar o `profile.team_id` no insert.

2. No método `onSubmit`, na parte de criar novo jogador (linha ~154), adicionar `team_id: profile?.team_id` ao payload do insert:

```typescript
const { data: newJogador, error: insertError } = await supabase
  .from("jogadores")
  .insert({
    nome: data.nome,
    apelido: data.apelido || null,
    posicao: data.posicao,
    telefone: data.telefone || null,
    email: data.email || null,
    foto_url: fotoUrl,
    user_id: user.id,
    ativo: true,
    team_id: profile?.team_id,  // <-- ADICIONAR ESTA LINHA
  })
  .select()
  .single();
```

Apenas uma linha precisa ser adicionada. Nenhuma outra mudança é necessária.
