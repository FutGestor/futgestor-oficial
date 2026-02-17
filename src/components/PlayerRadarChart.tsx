import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface PlayerRadarChartProps {
  jogadorId: string;
  teamId: string;
}

export function PlayerRadarChart({ jogadorId, teamId }: PlayerRadarChartProps) {
  const { data: radarData, isLoading } = useQuery({
    queryKey: ["player-radar-data", jogadorId, teamId],
    enabled: !!jogadorId && !!teamId,
    queryFn: async () => {
      // 1. Buscar estatísticas de todos os jogadores do time
      const { data: allStats, error: statsError } = await supabase
        .from("estatisticas_partida")
        .select("jogador_id, gols, assistencias, participou")
        .eq("team_id", teamId);

      if (statsError) throw statsError;

      // 2. Buscar votos de destaque e MVPs oficiais
      const { data: allVotos, error: votosError } = await supabase
        .from("votos_destaque")
        .select("jogador_id")
        .eq("team_id", teamId);

      const { data: allResults, error: resultsError } = await supabase
        .from("resultados")
        .select("mvp_jogador_id")
        .eq("team_id", teamId)
        .not("mvp_jogador_id", "is", null);

      if (votosError) throw votosError;
      if (resultsError) throw resultsError;

      // 3. Buscar total de jogos finalizados do time para cálculo de presença
      const { count: totalGames, error: gamesError } = await supabase
        .from("jogos")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", teamId)
        .eq("status", "finalizado");

      if (gamesError) throw gamesError;

      const gamesCount = totalGames || 1;

      // Agrupar estatísticas por jogador
      const playerMetrics = new Map<string, {
        gols: number;
        assists: number;
        jogos: number;
        votos: number;
        partGol: number;
      }>();

      allStats?.forEach(s => {
        const current = playerMetrics.get(s.jogador_id) || { gols: 0, assists: 0, jogos: 0, votos: 0, partGol: 0 };
        current.gols += s.gols || 0;
        current.assists += s.assistencias || 0;
        if (s.participou) current.jogos += 1;
        current.partGol = current.gols + current.assists;
        playerMetrics.set(s.jogador_id, current);
      });

      // Somar votos da votação
      allVotos?.forEach(v => {
        const current = playerMetrics.get(v.jogador_id) || { gols: 0, assists: 0, jogos: 0, votos: 0, partGol: 0 };
        current.votos += 1;
        playerMetrics.set(v.jogador_id, current);
      });

      // Somar MVPs oficiais
      allResults?.forEach(r => {
        if (r.mvp_jogador_id) {
          const current = playerMetrics.get(r.mvp_jogador_id) || { gols: 0, assists: 0, jogos: 0, votos: 0, partGol: 0 };
          current.votos += 1;
          playerMetrics.set(r.mvp_jogador_id, current);
        }
      });

      const metricsArray = Array.from(playerMetrics.values());
      const numPlayers = Math.max(playerMetrics.size, 1);

      // Calcular Médias do Time
      const teamTotals = metricsArray.reduce((acc, curr) => ({
        gols: acc.gols + curr.gols,
        assists: acc.assists + curr.assists,
        presenca: acc.presenca + (curr.jogos / gamesCount * 100),
        votos: acc.votos + curr.votos,
        partGol: acc.partGol + curr.partGol,
      }), { gols: 0, assists: 0, presenca: 0, votos: 0, partGol: 0 });

      const teamAvg = {
        gols: teamTotals.gols / numPlayers,
        assists: teamTotals.assists / numPlayers,
        presenca: teamTotals.presenca / numPlayers,
        votos: teamTotals.votos / numPlayers,
        partGol: teamTotals.partGol / numPlayers,
      };

      // Encontrar Máximos para Normalização (escala 0-100)
      const maxMetrics = {
        gols: Math.max(...metricsArray.map(m => m.gols), 1),
        assists: Math.max(...metricsArray.map(m => m.assists), 1),
        presenca: 100, // Presença é sempre %
        votos: Math.max(...metricsArray.map(m => m.votos), 1),
        partGol: Math.max(...metricsArray.map(m => m.partGol), 1),
      };

      // Estatísticas do Jogador Selecionado
      const target = playerMetrics.get(jogadorId) || { gols: 0, assists: 0, jogos: 0, votos: 0, partGol: 0 };
      const playerActual = {
        gols: target.gols,
        assists: target.assists,
        presenca: (target.jogos / gamesCount * 100),
        votos: target.votos,
        partGol: target.partGol,
      };

      // Formatar dados para o Radar (Normalizados 0-100)
      return [
        {
          subject: 'Gols',
          jogador: (playerActual.gols / maxMetrics.gols) * 100,
          time: (teamAvg.gols / maxMetrics.gols) * 100,
          fullMark: 100,
        },
        {
          subject: 'Assists',
          jogador: (playerActual.assists / maxMetrics.assists) * 100,
          time: (teamAvg.assists / maxMetrics.assists) * 100,
          fullMark: 100,
        },
        {
          subject: 'Presença',
          jogador: playerActual.presenca, // Já é 0-100
          time: teamAvg.presenca,
          fullMark: 100,
        },
        {
          subject: 'Destaques',
          jogador: (playerActual.votos / maxMetrics.votos) * 100,
          time: (teamAvg.votos / maxMetrics.votos) * 100,
          fullMark: 100,
        },
        {
          subject: 'Part. Gol',
          jogador: (playerActual.partGol / maxMetrics.partGol) * 100,
          time: (teamAvg.partGol / maxMetrics.partGol) * 100,
          fullMark: 100,
        },
      ];
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full bg-white/5 rounded-2xl border border-white/5 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-4">Calculando Radar...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[350px] mx-auto animate-in fade-in duration-700">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 900 }}
            />
            <Radar
              name="Jogador"
              dataKey="jogador"
              stroke="#0560B3"
              fill="#0560B3"
              fillOpacity={0.3}
              strokeWidth={3}
            />
            <Radar
              name="Média do Time"
              dataKey="time"
              stroke="rgba(255,255,255,0.4)"
              fill="rgba(255,255,255,0.1)"
              fillOpacity={0.1}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda Compacta */}
      <div className="flex items-center gap-6 mt-2 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#0560B3] rounded-full" />
          <span className="text-white italic">Seu Desempenho</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-zinc-600 border-t border-dashed border-zinc-400" />
          <span className="text-zinc-500 italic">Média do Time</span>
        </div>
      </div>
    </div>
  );
}
