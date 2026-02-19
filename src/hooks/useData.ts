import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Jogador, JogadorPublico, Jogo, Resultado, Transacao, Escalacao, EscalacaoJogador, Aviso, FinancialSummary, EstatisticaPartida, Time } from "@/lib/types";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";

// Jogadores (authenticated - full data)
export function useJogadores(ativos = true, teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["jogadores", ativos, effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      let query = supabase.from("jogadores").select("*").eq("team_id", effectiveTeamId!);
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
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["jogadores-publicos", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores_public" as any)
        .select("*")
        .eq("team_id", effectiveTeamId)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data as unknown) as JogadorPublico[];
    },
  });
}

// Jogos
export function useJogos(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["jogos", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // Buscar jogos do time
      const { data: jogos, error } = await supabase
        .from("jogos")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .order("data_hora", { ascending: false });
      
      if (error) {
        console.error("Erro useJogos:", error);
        throw error;
      }

      // Se não houver jogos, retornar array vazio
      if (!jogos || jogos.length === 0) {
        return [] as Jogo[];
      }

      // Buscar times adversários para enriquecer os dados
      const timeAdversarioIds = jogos
        .map(j => j.time_adversario_id)
        .filter((id): id is string => !!id);

      if (timeAdversarioIds.length > 0) {
        const { data: timesAdversarios } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .in("id", timeAdversarioIds);

        // Mapear times adversários nos jogos
        if (timesAdversarios) {
          const timesMap = new Map(timesAdversarios.map(t => [t.id, t]));
          
          return jogos.map(jogo => ({
            ...jogo,
            time_adversario: jogo.time_adversario_id 
              ? timesMap.get(jogo.time_adversario_id) || null
              : null
          })) as Jogo[];
        }
      }

      return jogos as Jogo[];
    },
  });
}

export function useJogo(jogoId?: string) {
  return useQuery({
    queryKey: ["jogo", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      // Fetch game
      const { data: jogo, error: jogoError } = await supabase
        .from("jogos")
        .select("*")
        .eq("id", jogoId!)
        .single();

      if (jogoError) throw jogoError;

      // Fetch time adversário if exists
      let timeAdversario = null;
      if (jogo.time_adversario_id) {
        const { data: time } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .eq("id", jogo.time_adversario_id)
          .single();
        timeAdversario = time;
      }

      // Fetch resultado
      const { data: resultado } = await supabase
        .from("resultados")
        .select("*, estatisticas_partida(*, jogador:jogadores(nome, apelido))")
        .eq("jogo_id", jogoId!)
        .maybeSingle();
      return {
        ...jogo,
        time_adversario: timeAdversario,
        resultado: resultado
      } as unknown as Jogo & { 
        time_adversario?: Time | null; 
        resultado?: (Resultado & { 
          estatisticas_partida: (EstatisticaPartida & { jogador?: { nome: string; apelido: string | null } })[] 
        }) | null;
      };
    },
  });
}

export function useProximoJogo(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["proximo-jogo", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // Usar início do dia atual para incluir jogos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: jogo, error } = await supabase
        .from("jogos")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .gte("data_hora", today.toISOString())
        .in("status", ["agendado", "confirmado"])
        .order("data_hora", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!jogo) return null;

      // Buscar time adversário
      if (jogo.time_adversario_id) {
        const { data: time } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .eq("id", jogo.time_adversario_id)
          .single();
        
        return { ...jogo, time_adversario: time } as Jogo;
      }

      return jogo as Jogo;
    },
  });
}

// Resultados
export function useResultados(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["resultados", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select(`
          *, 
          jogo:jogos(*, time_adversario:times(*)), 
          estatisticas_partida(*, jogador:jogadores(nome, apelido))
        `)
        .eq("team_id", effectiveTeamId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (Resultado & { 
        jogo: Jogo & { time_adversario?: Time | null }, 
        estatisticas_partida: (EstatisticaPartida & { jogador?: { nome: string; apelido: string | null } })[] 
      })[];
    },
  });
}

// Transações
export function useTransacoes(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["transacoes", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Transacao[];
    },
  });
}

export function useFinancialSummary(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["financial-summary", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // Use RPC for secure calculation (works for public page/anon users)
      const { data, error } = await supabase.rpc("get_financial_summary" as any, {
        _team_id: effectiveTeamId!,
      });

      if (error) throw error;

      // The RPC returns a single object compatible with FinancialSummary
      return (data as unknown) as FinancialSummary;
    },
  });
}

// Escalações
export function useEscalacoes(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["escalacoes", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacoes")
        .select(`
          *,
          jogo:jogos(*, time_adversario:times(*))
        `)
        .eq("team_id", effectiveTeamId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Escalacao & { jogo: Jogo })[];
    },
  });
}

export function useEscalacaoByJogoId(jogoId?: string) {
  return useQuery({
    queryKey: ["escalacao-jogo", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacoes")
        .select(`
          *,
          jogo:jogos(*, time_adversario:times(*))
        `)
        .eq("jogo_id", jogoId!)
        .maybeSingle();
      if (error) throw error;
      return data as (Escalacao & { jogo: Jogo }) | null;
    },
  });
}

export function useEscalacaoJogadores(escalacaoId: string | undefined) {
  return useQuery({
    queryKey: ["escalacao-jogadores", escalacaoId],
    enabled: !!escalacaoId,
    queryFn: async () => {
      // Buscar escalacao_jogadores sem embed para evitar ambiguidade
      const { data: ejData, error: ejError } = await supabase
        .from("escalacao_jogadores")
        .select("*")
        .eq("escalacao_id", escalacaoId)
        .order("ordem");
      
      if (ejError) throw ejError;
      if (!ejData || ejData.length === 0) return [];

      // Buscar os jogadores separadamente
      const jogadorIds = ejData.map(ej => ej.jogador_id).filter(Boolean);
      
      if (jogadorIds.length === 0) {
        return ejData.map(ej => ({ ...ej, jogador: null })) as (EscalacaoJogador & { jogador: Jogador | null })[];
      }

      const { data: jogadoresData, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("*")
        .in("id", jogadorIds);

      if (jogadoresError) throw jogadoresError;

      // Juntar os dados
      const jogadoresMap = new Map(jogadoresData?.map(j => [j.id, j]) || []);
      
      return ejData.map(ej => ({
        ...ej,
        jogador: jogadoresMap.get(ej.jogador_id) || null,
      })) as (EscalacaoJogador & { jogador: Jogador | null })[];
    },
  });
}

export function useProximaEscalacao(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["proxima-escalacao", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalacoes")
        .select(`
          *,
          jogo:jogos(*, time_adversario:times(*))
        `)
        .eq("team_id", effectiveTeamId!)
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
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["ultimo-resultado", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select(`*, jogo:jogos(*, time_adversario:times(*))`)
        .eq("team_id", effectiveTeamId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Resultado & { jogo: Jogo & { time_adversario?: Time | null } }) | null;
    },
  });
}

// Jogos futuros (para agendamento de visitantes)
export function useJogosFuturos(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["jogos-futuros", effectiveTeamId],
    enabled: !!effectiveTeamId,
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
        .eq("team_id", effectiveTeamId!)
        .in("status", ["agendado", "confirmado"]);

      if (error) throw error;
      return data as { id: string; data_hora: string; time_adversario: { id: string; nome: string; apelido: string | null; escudo_url: string | null } | null }[];
    },
  });
}

// Avisos
export function useAvisos(limit?: number, teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery({
    queryKey: ["avisos", limit, effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      let query = supabase
        .from("avisos")
        .select("*")
        .eq("publicado", true)
        .eq("team_id", effectiveTeamId!)
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


export function useCraqueVoting(gameId?: string) {
  return useQuery({
    queryKey: ["craque-voting", gameId],
    enabled: !!gameId,
    queryFn: async () => {
      // Usar a view ou RPC criada
      const { data, error } = await supabase
        .from("view_craque_jogo" as any)
        .select("*")
        .eq("jogo_id", gameId!);
      
      if (error) throw error;
      return (data as unknown) as { jogo_id: string; jogador_id: string; votos: number }[];
    },
    refetchInterval: 10000, // Atualizar a cada 10s
  });
}
