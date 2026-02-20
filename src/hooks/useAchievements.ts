import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AchievementTier } from "@/components/achievements/AchievementBadge";
import type {
  Tier,
  Achievement,
  PlayerAchievement,
  AchievementDB,
  PlayerAchievementDB,
} from "@/types/achievements";

export type { Tier, Achievement, PlayerAchievement };

/** Buscar conquistas de um jogador com progresso */
export function usePlayerAchievements(jogadorId: string | undefined) {
  return useQuery<PlayerAchievement[]>({
    queryKey: ["player-achievements", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      // 1. Buscar todas as definições de conquistas
      const { data: achievements, error: achError } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (achError) throw achError;

      // 2. Buscar o progresso do jogador
      const { data: progress, error: progError } = await supabase
        .from("player_achievements")
        .select("*")
        .eq("jogador_id", jogadorId!);

      if (progError) throw progError;

      // 3. Mapear e combinar dados
      const typedAchievements = (achievements || []) as Achievement[];
      const typedProgress = (progress || []) as PlayerAchievementDB[];

      return typedAchievements.map((ach): PlayerAchievement => {
        const p = typedProgress.find((p) => p.achievement_id === ach.id);
        return {
          achievement_id: ach.id,
          current_tier: p?.current_tier ?? null,
          current_value: p?.current_value ?? 0,
          unlocked_at: p?.unlocked_at ?? null,
          achievement: ach,
        };
      });
    },
  });
}

/** Buscar todas as conquistas disponíveis */
export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return (data || []) as Achievement[];
    },
  });
}

/** Buscar progresso de conquistas de múltiplos jogadores */
export function useTeamAchievements(teamId: string | undefined) {
  return useQuery<{
    jogador_id: string;
    jogador_nome: string;
    conquistas_desbloqueadas: number;
    total_conquistas: number;
  }[]>({
    queryKey: ["team-achievements", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      // Buscar jogadores do time com suas conquistas
      const { data, error } = await supabase.rpc("get_team_achievements", {
        _team_id: teamId,
      });

      if (error) throw error;
      return (data || []) as {
        jogador_id: string;
        jogador_nome: string;
        conquistas_desbloqueadas: number;
        total_conquistas: number;
      }[];
    },
  });
}
