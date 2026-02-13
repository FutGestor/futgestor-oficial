import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EstatisticaPartida, EstatisticasJogador, Jogador } from "@/lib/types";

// Estatísticas de uma partida específica
export function useEstatisticasPartida(resultadoId: string | undefined) {
  return useQuery({
    queryKey: ["estatisticas-partida", resultadoId],
    enabled: !!resultadoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estatisticas_partida")
        .select(`*, jogador:jogadores(*)`)
        .eq("resultado_id", resultadoId)
        .order("gols", { ascending: false });
      if (error) throw error;
      return data as (EstatisticaPartida & { jogador: Jogador })[];
    },
  });
}

// Estatísticas totais de todos os jogadores
export function useEstatisticasJogadores() {
  return useQuery({
    queryKey: ["estatisticas-jogadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estatisticas_partida")
        .select("*");
      if (error) throw error;

      // Agregar estatísticas por jogador
      const estatisticasPorJogador: Record<string, EstatisticasJogador> = {};

      for (const stat of data) {
        if (!estatisticasPorJogador[stat.jogador_id]) {
          estatisticasPorJogador[stat.jogador_id] = {
            jogador_id: stat.jogador_id,
            jogos: 0,
            gols: 0,
            assistencias: 0,
            cartoes_amarelos: 0,
            cartoes_vermelhos: 0,
          };
        }

        const jogadorStats = estatisticasPorJogador[stat.jogador_id];
        if (stat.participou) jogadorStats.jogos++;
        jogadorStats.gols += stat.gols;
        jogadorStats.assistencias += stat.assistencias;
        if (stat.cartao_amarelo) jogadorStats.cartoes_amarelos++;
        if (stat.cartao_vermelho) jogadorStats.cartoes_vermelhos++;
      }

      return estatisticasPorJogador;
    },
  });
}

// Ranking de artilheiros e assistências
export function useRanking(teamId?: string | null) {
  return useQuery({
    queryKey: ["ranking", teamId],
    queryFn: async () => {
      // Buscar todas as estatísticas com jogadores
      let query = supabase
        .from("estatisticas_partida")
        .select(`*, jogador:jogadores(*)`);

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data: estatisticas, error: estError } = await query;
      if (estError) throw estError;

      // Agregar por jogador
      const jogadoresMap: Record<string, {
        jogador: Jogador;
        gols: number;
        assistencias: number;
        jogos: number;
        cartoes_amarelos: number;
        cartoes_vermelhos: number;
      }> = {};

      for (const stat of estatisticas) {
        if (!stat.jogador) continue;
        
        if (!jogadoresMap[stat.jogador_id]) {
          jogadoresMap[stat.jogador_id] = {
            jogador: stat.jogador as Jogador,
            gols: 0,
            assistencias: 0,
            jogos: 0,
            cartoes_amarelos: 0,
            cartoes_vermelhos: 0,
          };
        }

        const entry = jogadoresMap[stat.jogador_id];
        if (stat.participou) entry.jogos++;
        entry.gols += stat.gols;
        entry.assistencias += stat.assistencias;
        if (stat.cartao_amarelo) entry.cartoes_amarelos++;
        if (stat.cartao_vermelho) entry.cartoes_vermelhos++;
      }

      const jogadores = Object.values(jogadoresMap);

      // Ordenar para artilheiros
      const artilheiros = [...jogadores]
        .filter(j => j.gols > 0)
        .sort((a, b) => b.gols - a.gols);

      // Ordenar para assistências
      const assistencias = [...jogadores]
        .filter(j => j.assistencias > 0)
        .sort((a, b) => b.assistencias - a.assistencias);

      // Ordenar por participação
      const participacao = [...jogadores]
        .filter(j => j.jogos > 0)
        .sort((a, b) => b.jogos - a.jogos);

      return { artilheiros, assistencias, participacao };
    },
  });
}

// Ranking de destaques (MVP escolhido pelo admin)
export function useRankingDestaques(teamId?: string | null) {
  return useQuery({
    queryKey: ["ranking-destaques", teamId],
    queryFn: async () => {
      let query = supabase
        .from("resultados")
        .select(`
          mvp_jogador_id,
          jogador:jogadores!resultados_mvp_jogador_id_fkey(id, nome, apelido, foto_url),
          jogo:jogos!inner(team_id)
        `)
        .not("mvp_jogador_id", "is", null);

      if (teamId) {
        query = query.eq("jogo.team_id", teamId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agregar MVPs por jogador
      const mvpMap: Record<string, {
        jogador: {
          id: string;
          nome: string;
          apelido: string | null;
          foto_url: string | null;
        };
        votos: number;
      }> = {};

      for (const row of data) {
        if (!row.jogador || !row.mvp_jogador_id) continue;
        
        const jogador = row.jogador as unknown as {
          id: string;
          nome: string;
          apelido: string | null;
          foto_url: string | null;
        };
        
        if (!mvpMap[row.mvp_jogador_id]) {
          mvpMap[row.mvp_jogador_id] = {
            jogador,
            votos: 0,
          };
        }
        mvpMap[row.mvp_jogador_id].votos++;
      }

      return Object.values(mvpMap).sort((a, b) => b.votos - a.votos);
    },
  });
}

// Mutação para salvar estatísticas de uma partida
export function useSaveEstatisticasPartida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resultadoId,
      estatisticas,
      team_id,
    }: {
      resultadoId: string;
      team_id?: string;
      estatisticas: Array<{
        jogador_id: string;
        gols: number;
        assistencias: number;
        cartao_amarelo: boolean;
        cartao_vermelho: boolean;
        participou: boolean;
      }>;
    }) => {
      // Deletar estatísticas existentes
      await supabase
        .from("estatisticas_partida")
        .delete()
        .eq("resultado_id", resultadoId);

      // Inserir novas
      if (estatisticas.length > 0) {
        const { error } = await supabase.from("estatisticas_partida").insert(
          estatisticas.map((e) => ({
            resultado_id: resultadoId,
            jogador_id: e.jogador_id,
            gols: e.gols,
            assistencias: e.assistencias,
            cartao_amarelo: e.cartao_amarelo,
            cartao_vermelho: e.cartao_vermelho,
            participou: e.participou,
            team_id,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estatisticas-partida"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-jogadores"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}
// Estatísticas detalhadas de performance de um jogador para dashboard
export function usePlayerPerformance(jogadorId: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: ["player-performance", jogadorId, teamId],
    enabled: !!jogadorId && !!teamId,
    queryFn: async () => {
      // 1. Buscar histórico de estatísticas do jogador com data do jogo
      const { data: playerStats, error: playerError } = await supabase
        .from("estatisticas_partida")
        .select(`
          gols, 
          assistencias, 
          participou,
          cartao_amarelo,
          cartao_vermelho,
          resultado:resultados!inner(
            mvp_jogador_id,
            jogo:jogos!inner(data_hora)
          )
        `)
        .eq("jogador_id", jogadorId!)
        .eq("team_id", teamId!);

      if (playerError) throw playerError;

      // 2. Buscar estatísticas de TODOS os jogadores do time para calcular médias
      const { data: teamStats, error: teamError } = await supabase
        .from("estatisticas_partida")
        .select("gols, assistencias, participou, jogador_id")
        .eq("team_id", teamId!);

      if (teamError) throw teamError;

      return {
        playerStats: playerStats as any[],
        teamStats: teamStats as any[]
      };
    },
  });
}
