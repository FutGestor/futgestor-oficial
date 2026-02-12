import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Jogador, JogadorPublico, Jogo, Resultado, Transacao, Escalacao, EscalacaoJogador, Aviso, FinancialSummary } from "@/lib/types";

// Jogadores (authenticated - full data)
export function useJogadores(ativos = true, teamId?: string) {
  return useQuery({
    queryKey: ["jogadores", ativos, teamId],
    enabled: !!teamId,
    queryFn: async () => {
      let query = supabase.from("jogadores").select("*").eq("team_id", teamId!);
      if (ativos) {
        query = query.eq("ativo", true);
      }
      const { data, error } = await query.order("nome");
      if (error) throw error;
      return data as Jogador[];
    },
  });
}

// Jogadores públicos (view sem email/telefone)
export function useJogadoresPublicos(teamId?: string) {
  return useQuery({
    queryKey: ["jogadores-publicos", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores_public" as any)
        .select("*")
        .eq("team_id", teamId)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data as unknown) as JogadorPublico[];
    },
  });
}

// Jogos
export function useJogos(teamId?: string) {
  return useQuery({
    queryKey: ["jogos", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      let query = supabase.from("jogos").select(`*, time_adversario:times(*)`).eq("team_id", teamId!);
      const { data, error } = await query.order("data_hora", { ascending: false });
      if (error) throw error;
      return data as Jogo[];
    },
  });
}

export function useProximoJogo(teamId?: string) {
  return useQuery({
    queryKey: ["proximo-jogo", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      // Usar início do dia atual para incluir jogos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("jogos")
        .select("*")
        .eq("team_id", teamId!)
        .gte("data_hora", today.toISOString())
        .in("status", ["agendado", "confirmado"])
        .order("data_hora", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Jogo | null;
    },
  });
}

// Resultados
export function useResultados(teamId?: string) {
  return useQuery({
    queryKey: ["resultados", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      let query = supabase.from("resultados").select(`*, jogo:jogos(*)`).eq("team_id", teamId!);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Resultado & { jogo: Jogo })[];
    },
  });
}

// Transações
export function useTransacoes(teamId?: string) {
  return useQuery({
    queryKey: ["transacoes", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select("*")
        .eq("team_id", teamId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Transacao[];
    },
  });
}

export function useFinancialSummary(teamId?: string) {
  return useQuery({
    queryKey: ["financial-summary", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      // Use RPC for secure calculation (works for public page/anon users)
      const { data, error } = await supabase.rpc("get_financial_summary", {
        _team_id: teamId!,
      });

      if (error) throw error;

      // The RPC returns a single object compatible with FinancialSummary
      return data as FinancialSummary;
    },
  });
}

// Escalações
export function useEscalacoes(teamId?: string) {
  return useQuery({
    queryKey: ["escalacoes", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacoes")
        .select(`
          *,
          jogo:jogos(*)
        `)
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Escalacao & { jogo: Jogo })[];
    },
  });
}

export function useEscalacaoJogadores(escalacaoId: string | undefined) {
  return useQuery({
    queryKey: ["escalacao-jogadores", escalacaoId],
    enabled: !!escalacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacao_jogadores")
        .select(`
          *,
          jogador:jogadores(*)
        `)
        .eq("escalacao_id", escalacaoId)
        .order("ordem");
      if (error) throw error;
      return data as (EscalacaoJogador & { jogador: Jogador })[];
    },
  });
}

export function useProximaEscalacao(teamId?: string) {
  return useQuery({
    queryKey: ["proxima-escalacao", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacoes")
        .select(`
          *,
          jogo:jogos(*)
        `)
        .eq("team_id", teamId!)
        .eq("publicada", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (Escalacao & { jogo: Jogo }) | null;
    },
  });
}

// Último Resultado
export function useUltimoResultado(teamId?: string) {
  return useQuery({
    queryKey: ["ultimo-resultado", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select(`*, jogo:jogos(*)`)
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (Resultado & { jogo: Jogo }) | null;
    },
  });
}

// Jogos futuros (para agendamento de visitantes)
export function useJogosFuturos(teamId?: string) {
  return useQuery({
    queryKey: ["jogos-futuros", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("jogos")
        .select(`
          id, 
          data_hora,
          time_adversario:times(id, nome, apelido, escudo_url)
        `)
        .gte("data_hora", today.toISOString())
        .eq("team_id", teamId!)
        .in("status", ["agendado", "confirmado"]);

      if (error) throw error;
      return data as { id: string; data_hora: string; time_adversario: { id: string; nome: string; apelido: string | null; escudo_url: string | null } | null }[];
    },
  });
}

// Avisos
export function useAvisos(limit?: number, teamId?: string) {
  return useQuery({
    queryKey: ["avisos", limit, teamId],
    enabled: !!teamId,
    queryFn: async () => {
      let query = supabase
        .from("avisos")
        .select("*")
        .eq("publicado", true)
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Aviso[];
    },
  });
}
