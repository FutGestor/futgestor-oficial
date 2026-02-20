import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import type {
  EstatisticaPartida,
  EstatisticasJogador,
  RankingJogador,
  RankingMVP,
  PlayerPerformance,
} from "@/types/database";

// ============================================
// ESTATÍSTICAS DE PARTIDA
// ============================================

export function useEstatisticasPartida(resultadoId?: string) {
  return useQuery<EstatisticaPartida[]>({
    queryKey: ["estatisticas-partida", resultadoId],
    enabled: !!resultadoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estatisticas_partida")
        .select("*")
        .eq("resultado_id", resultadoId!)
        .order("created_at");
      if (error) throw error;
      return data as EstatisticaPartida[];
    },
  });
}

export function useSaveEstatisticasPartida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resultadoId,
      estatisticas,
    }: {
      resultadoId: string;
      estatisticas: Array<{
        jogador_id: string;
        gols?: number;
        assistencias?: number;
        cartao_amarelo?: boolean;
        cartao_vermelho?: boolean;
        participou?: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("estatisticas_partida")
        .upsert(
          estatisticas.map((e) => ({
            resultado_id: resultadoId,
            jogador_id: e.jogador_id,
            gols: e.gols || 0,
            assistencias: e.assistencias || 0,
            cartao_amarelo: e.cartao_amarelo || false,
            cartao_vermelho: e.cartao_vermelho || false,
            participou: e.participou !== false,
          })),
          { onConflict: "resultado_id,jogador_id" }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["estatisticas-partida", variables.resultadoId],
      });
    },
  });
}

// ============================================
// ESTATÍSTICAS DE JOGADORES
// ============================================

export function useEstatisticasJogador(jogadorId?: string) {
  return useQuery<EstatisticasJogador | null>({
    queryKey: ["estatisticas-jogador", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      const { data: estatisticas, error } = await supabase
        .from("estatisticas_partida")
        .select("*")
        .eq("jogador_id", jogadorId!);

      if (error) throw error;
      if (!estatisticas || estatisticas.length === 0) {
        return {
          jogador_id: jogadorId!,
          jogos: 0,
          gols: 0,
          assistencias: 0,
          cartoes_amarelos: 0,
          cartoes_vermelhos: 0,
        };
      }

      const stats = {
        jogador_id: jogadorId!,
        jogos: estatisticas.length,
        gols: 0,
        assistencias: 0,
        cartoes_amarelos: 0,
        cartoes_vermelhos: 0,
      };

      for (const est of estatisticas) {
        stats.gols += est.gols || 0;
        stats.assistencias += est.assistencias || 0;
        if (est.cartao_amarelo) stats.cartoes_amarelos += 1;
        if (est.cartao_vermelho) stats.cartoes_vermelhos += 1;
      }

      return stats;
    },
  });
}

export function useEstatisticasJogadores(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<EstatisticasJogador[]>({
    queryKey: ["estatisticas-jogadores", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // Buscar jogadores do time
      const { data: jogadores, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("id")
        .eq("team_id", effectiveTeamId!)
        .eq("ativo", true);

      if (jogadoresError) throw jogadoresError;
      if (!jogadores || jogadores.length === 0) return [];

      const jogadorIds = jogadores.map(j => j.id);

      // Buscar estatísticas dos jogadores
      const { data: estatisticas, error: estatisticasError } = await supabase
        .from("estatisticas_partida")
        .select("*, resultado:resultados(team_id)")
        .in("jogador_id", jogadorIds);

      if (estatisticasError) throw estatisticasError;

      // Agrupar estatísticas por jogador
      const statsMap = new Map<string, EstatisticasJogador>();

      for (const est of estatisticas || []) {
        // Verificar se a estatística pertence ao time correto
        if (est.resultado?.team_id !== effectiveTeamId) continue;

        const current = statsMap.get(est.jogador_id) || {
          jogador_id: est.jogador_id,
          jogos: 0,
          gols: 0,
          assistencias: 0,
          cartoes_amarelos: 0,
          cartoes_vermelhos: 0,
        };

        current.jogos += 1;
        current.gols += est.gols || 0;
        current.assistencias += est.assistencias || 0;
        if (est.cartao_amarelo) current.cartoes_amarelos += 1;
        if (est.cartao_vermelho) current.cartoes_vermelhos += 1;

        statsMap.set(est.jogador_id, current);
      }

      return Array.from(statsMap.values());
    },
  });
}

// ============================================
// RANKING
// ============================================

export function useRankingDestaques(teamId?: string) {
  return useRankingMVPs(teamId);
}

export interface RankingData {
  artilheiros: RankingJogador[];
  assistencias: RankingJogador[];
  participacao: RankingJogador[];
}

export function useRanking(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<RankingData>({
    queryKey: ["ranking", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data: jogadores, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .eq("ativo", true);

      if (jogadoresError) throw jogadoresError;
      if (!jogadores || jogadores.length === 0) {
        return { artilheiros: [], assistencias: [], participacao: [] };
      }

      const jogadorIds = jogadores.map((j) => j.id);

      // Buscar estatísticas filtrando pelo team_id também para garantir dados corretos
      const { data: estatisticas, error: estatisticasError } = await supabase
        .from("estatisticas_partida")
        .select("*, resultado:resultados!inner(team_id)")
        .in("jogador_id", jogadorIds)
        .eq("resultado.team_id", effectiveTeamId!);

      if (estatisticasError) throw estatisticasError;

      const statsMap = new Map<
        string,
        { gols: number; assistencias: number; jogos: number; cartoes_amarelos: number; cartoes_vermelhos: number }
      >();

      for (const est of estatisticas || []) {
        const current = statsMap.get(est.jogador_id) || {
          gols: 0,
          assistencias: 0,
          jogos: 0,
          cartoes_amarelos: 0,
          cartoes_vermelhos: 0,
        };
        current.gols += est.gols || 0;
        current.assistencias += est.assistencias || 0;
        current.jogos += 1;
        if (est.cartao_amarelo) current.cartoes_amarelos += 1;
        if (est.cartao_vermelho) current.cartoes_vermelhos += 1;
        statsMap.set(est.jogador_id, current);
      }

      const ranking: RankingJogador[] = jogadores.map((jogador) => {
        const stats = statsMap.get(jogador.id) || {
          gols: 0,
          assistencias: 0,
          jogos: 0,
          cartoes_amarelos: 0,
          cartoes_vermelhos: 0,
        };

        return {
          jogador,
          gols: stats.gols,
          assistencias: stats.assistencias,
          jogos: stats.jogos,
          cartoes_amarelos: stats.cartoes_amarelos,
          cartoes_vermelhos: stats.cartoes_vermelhos,
          media_gols: stats.jogos > 0 ? stats.gols / stats.jogos : 0,
        };
      });

      // Artilheiros: ordenados por gols (decrescente)
      const artilheiros = [...ranking]
        .filter((r) => r.gols > 0)
        .sort((a, b) => b.gols - a.gols);

      // Assistências: ordenados por assistências (decrescente)
      const assistencias = [...ranking]
        .filter((r) => r.assistencias > 0)
        .sort((a, b) => b.assistencias - a.assistencias);

      // Participação: ordenados por média de gols (decrescente), mas mostra todos que jogaram
      const participacao = [...ranking]
        .filter((r) => r.jogos > 0)
        .sort((a, b) => b.media_gols - a.media_gols);

      return { artilheiros, assistencias, participacao };
    },
  });
}

export function useRankingMVPs(teamId?: string) {
  const context = useOptionalTeamSlug();
  const effectiveTeamId = teamId || context?.team.id;

  return useQuery<RankingMVP[]>({
    queryKey: ["ranking-mvps", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data: resultados, error: resultadosError } = await supabase
        .from("resultados")
        .select("mvp_jogador_id")
        .eq("team_id", effectiveTeamId!)
        .not("mvp_jogador_id", "is", null);

      if (resultadosError) throw resultadosError;

      const mvpCounts = new Map<string, number>();
      for (const r of resultados || []) {
        if (r.mvp_jogador_id) {
          mvpCounts.set(r.mvp_jogador_id, (mvpCounts.get(r.mvp_jogador_id) || 0) + 1);
        }
      }

      if (mvpCounts.size === 0) return [];

      const jogadorIds = Array.from(mvpCounts.keys());

      const { data: jogadores, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("id, nome, apelido, foto_url")
        .in("id", jogadorIds);

      if (jogadoresError) throw jogadoresError;

      const jogadoresMap = new Map(jogadores?.map((j) => [j.id, j]) || []);

      const ranking: RankingMVP[] = Array.from(mvpCounts.entries())
        .map(([jogadorId, votos]) => {
          const jogador = jogadoresMap.get(jogadorId);
          return {
            jogador: {
              id: jogadorId,
              nome: jogador?.nome || "Jogador Removido",
              apelido: jogador?.apelido || null,
              foto_url: jogador?.foto_url || null,
            },
            votos,
          };
        })
        .sort((a, b) => b.votos - a.votos);

      return ranking;
    },
  });
}

// ============================================
// PERFORMANCE DO JOGADOR
// ============================================

export function usePlayerPerformance(jogadorId?: string) {
  return useQuery<PlayerPerformance | null>({
    queryKey: ["player-performance", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_player_performance", {
        _jogador_id: jogadorId!,
      });

      if (error) throw error;
      return data as unknown as PlayerPerformance | null;
    },
  });
}
