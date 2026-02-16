import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AchievementTier } from "@/components/achievements/AchievementBadge";

export interface Tier {
  level: AchievementTier;
  label: string;
  threshold: number;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  applicable_positions: string[];
  tiers: Tier[];
}

export interface PlayerAchievement {
  achievement_id: string;
  current_tier: AchievementTier;
  current_value: number;
  unlocked_at?: string;
  achievement: Achievement;
}

export function usePlayerAchievements(jogadorId: string | undefined) {
  return useQuery({
    queryKey: ["player-achievements", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      // 1. Buscar todas as definições de conquistas
      const { data: achievements, error: achError } = await (supabase
        .from("achievements" as any)
        .select("*")
        .order("category", { ascending: true }) as any);

      if (achError) throw achError;

      // 2. Buscar o progresso do jogador
      const { data: progress, error: progError } = await (supabase
        .from("player_achievements" as any)
        .select("*")
        .eq("jogador_id", jogadorId!) as any);

      if (progError) throw progError;

      // 3. Mapear e combinar
      return (achievements as any[]).map((ach) => {
        const p = (progress as any[]).find((p) => p.achievement_id === ach.id);
        return {
          achievement_id: ach.id,
          current_tier: (p?.current_tier as AchievementTier) || null,
          current_value: p?.current_value || 0,
          unlocked_at: p?.unlocked_at,
          achievement: ach,
        } as PlayerAchievement;
      });
    },
  });
}
