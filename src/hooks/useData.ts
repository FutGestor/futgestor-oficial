import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import type {
  Jogador,
  JogadorPublico,
  Jogo,
  JogoComTimeAdversario,
  Resultado,
  ResultadoComJogo,
  Transacao,
  Escalacao,
  EscalacaoComJogo,
  EscalacaoJogador,
  EstatisticaPartida,
  Aviso,
  Time,
  ViewCraqueJogo,
} from "@/types/database";
import type { FinancialSummary } from "@/lib/types";

// ============================================
// JOGADORES
// ============================================

export function useJogadores(ativos = true, teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<Jogador[]>({
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

export function useJogadoresPublicos(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<JogadorPublico[]>({
    queryKey: ["jogadores-publicos", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores_public")
        .select("*")
        .eq("team_id", effectiveTeamId)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as unknown as JogadorPublico[];
    },
  });
}

// ============================================
// JOGOS
// ============================================

export function useJogos(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<JogoComTimeAdversario[]>({
    queryKey: ["jogos", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data: jogos, error } = await supabase
        .from("jogos")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .order("data_hora", { ascending: false });
      
      if (error) {
        console.error("Erro useJogos:", error);
        throw error;
      }

      if (!jogos || jogos.length === 0) {
        return [] as JogoComTimeAdversario[];
      }

      const timeAdversarioIds = jogos
        .map(j => j.time_adversario_id)
        .filter((id): id is string => !!id);

      if (timeAdversarioIds.length > 0) {
        const { data: timesAdversarios } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .in("id", timeAdversarioIds);

        if (timesAdversarios) {
          const timesMap = new Map(timesAdversarios.map(t => [t.id, t]));
          
          return jogos.map(jogo => ({
            ...jogo,
            time_adversario: jogo.time_adversario_id 
              ? timesMap.get(jogo.time_adversario_id) || null
              : null
          })) as JogoComTimeAdversario[];
        }
      }

      return jogos as JogoComTimeAdversario[];
    },
  });
}

export function useJogo(jogoId?: string) {
  return useQuery<JogoComTimeAdversario & { resultado?: ResultadoComJogo["resultado"] } | null>({
    queryKey: ["jogo", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      const { data: jogo, error: jogoError } = await supabase
        .from("jogos")
        .select("*")
        .eq("id", jogoId!)
        .single();

      if (jogoError) throw jogoError;

      let timeAdversario: Time | null = null;
      if (jogo.time_adversario_id) {
        const { data: time } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .eq("id", jogo.time_adversario_id)
          .single();
        timeAdversario = time as Time | null;
      }

      const { data: resultado } = await supabase
        .from("resultados")
        .select("*, estatisticas_partida(*, jogador:jogadores(nome, apelido))")
        .eq("jogo_id", jogoId!)
        .maybeSingle();

      return {
        ...jogo,
        time_adversario: timeAdversario,
        resultado: resultado as ResultadoComJogo["resultado"] | undefined,
      } as JogoComTimeAdversario & { resultado?: ResultadoComJogo["resultado"] };
    },
  });
}

export function useProximoJogo(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<JogoComTimeAdversario | null>({
    queryKey: ["proximo-jogo", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
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

      if (jogo.time_adversario_id) {
        const { data: time } = await supabase
          .from("times")
          .select("id, nome, apelido, escudo_url, cidade, uf")
          .eq("id", jogo.time_adversario_id)
          .single();
        
        return { ...jogo, time_adversario: time as Time | null } as JogoComTimeAdversario;
      }

      return jogo as JogoComTimeAdversario;
    },
  });
}

export function useJogosFuturos(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<Array<{ id: string; data_hora: string; time_adversario: { id: string; nome: string; apelido: string | null; escudo_url: string | null } | null }>>({
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
      return data as Array<{ id: string; data_hora: string; time_adversario: { id: string; nome: string; apelido: string | null; escudo_url: string | null } | null }>;
    },
  });
}

// ============================================
// RESULTADOS
// ============================================

export function useResultados(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<ResultadoComJogo[]>({
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
      return data as ResultadoComJogo[];
    },
  });
}

export function useUltimoResultado(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<ResultadoComJogo | null>({
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
      return data as ResultadoComJogo | null;
    },
  });
}

// ============================================
// TRANSAÇÕES
// ============================================

export function useTransacoes(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<Transacao[]>({
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

  return useQuery<FinancialSummary>({
    queryKey: ["financial-summary", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // Buscar transações diretamente
      const { data: transacoes, error } = await supabase
        .from("transacoes")
        .select("tipo, valor")
        .eq("team_id", effectiveTeamId!);

      if (error) throw error;

      // Calcular resumo
      if (!transacoes || transacoes.length === 0) {
        return {
          saldoAtual: 0,
          totalArrecadado: 0,
          totalGasto: 0,
        };
      }

      const totalArrecadado = transacoes
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + (t.valor || 0), 0);
      
      const totalGasto = transacoes
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      return {
        saldoAtual: totalArrecadado - totalGasto,
        totalArrecadado,
        totalGasto,
      };
    },
  });
}

// ============================================
// ESCALAÇÕES
// ============================================

export function useEscalacoes(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<EscalacaoComJogo[]>({
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
      return data as EscalacaoComJogo[];
    },
  });
}

export function useEscalacaoByJogoId(jogoId?: string) {
  return useQuery<EscalacaoComJogo | null>({
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
      return data as EscalacaoComJogo | null;
    },
  });
}

export function useEscalacaoJogadores(escalacaoId: string | undefined) {
  return useQuery<(EscalacaoJogador & { jogador: Jogador | null })[]>({
    queryKey: ["escalacao-jogadores", escalacaoId],
    enabled: !!escalacaoId,
    queryFn: async () => {
      const { data: ejData, error: ejError } = await supabase
        .from("escalacao_jogadores")
        .select("*")
        .eq("escalacao_id", escalacaoId)
        .order("ordem");
      
      if (ejError) throw ejError;
      if (!ejData || ejData.length === 0) return [];

      const jogadorIds = ejData.map(ej => ej.jogador_id).filter(Boolean);
      
      if (jogadorIds.length === 0) {
        return ejData.map(ej => ({ ...ej, jogador: null })) as (EscalacaoJogador & { jogador: Jogador | null })[];
      }

      const { data: jogadoresData, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("*")
        .in("id", jogadorIds);

      if (jogadoresError) throw jogadoresError;

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

  return useQuery<EscalacaoComJogo | null>({
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
      return data as EscalacaoComJogo | null;
    },
  });
}

// ============================================
// AVISOS
// ============================================

export function useAvisos(limit?: number, teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<Aviso[]>({
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

// ============================================
// VOTAÇÃO CRAQUE
// ============================================

export function useCraqueVoting(gameId?: string) {
  return useQuery<ViewCraqueJogo[]>({
    queryKey: ["craque-voting", gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("view_craque_jogo")
        .select("*")
        .eq("jogo_id", gameId!);
      
      if (error) throw error;
      return data as unknown as ViewCraqueJogo[];
    },
    refetchInterval: 10000,
  });
}
