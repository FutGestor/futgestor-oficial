import React, { useState } from "react";
import { AchievementBadge, AchievementTier } from "./AchievementBadge";
import { AchievementDetailsModal } from "./AchievementDetailsModal";
import { usePlayerAchievements, PlayerAchievement } from "@/hooks/useAchievements";
import { Skeleton } from "@/components/ui/skeleton";

interface AchievementGridProps {
  jogadorId: string;
  jogadorPosicao?: string;
  jogadorNome?: string;
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ jogadorId, jogadorPosicao, jogadorNome }) => {
  const { data: achievements, isLoading } = usePlayerAchievements(jogadorId);
  const [selectedAchievement, setSelectedAchievement] = useState<PlayerAchievement | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 py-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="w-16 h-20 rounded-lg bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        Nenhuma conquista disponível ainda.
      </div>
    );
  }

  // Filtrar e agrupar conquistas
  const universalAchievements = achievements.filter(item => 
    !item.achievement.applicable_positions || item.achievement.applicable_positions.length === 0
  );

  const positionAchievements = achievements.filter(item => 
    item.achievement.applicable_positions && 
    item.achievement.applicable_positions.length > 0 &&
    (!jogadorPosicao || item.achievement.applicable_positions.some(p => p.toLowerCase() === jogadorPosicao.toLowerCase()))
  );

  const sortAchievements = (list: PlayerAchievement[]) => {
    return [...list].sort((a, b) => {
      // Desbloqueadas primeiro
      if (a.current_tier && !b.current_tier) return -1;
      if (!a.current_tier && b.current_tier) return 1;
      return 0;
    });
  };

  const sortedUniversal = sortAchievements(universalAchievements);
  const sortedPosition = sortAchievements(positionAchievements);

  const renderSection = (title: string, list: PlayerAchievement[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-500/10 pb-2">
          {title}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-6 justify-items-center">
          {list.map((item) => (
            <AchievementBadge
              key={item.achievement_id}
              slug={item.achievement.slug}
              tier={item.current_tier}
              iconName={item.achievement.icon}
              size="md"
              locked={!item.current_tier}
              onClick={() => setSelectedAchievement(item)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
          🏆 CONQUISTAS DE {jogadorNome || "JOGADOR"}
        </h2>
        {jogadorPosicao && (
          <p className="text-xs text-primary font-bold uppercase tracking-widest">{jogadorPosicao}</p>
        )}
      </div>

      {renderSection("━━ Conquistas Universais ━━", sortedUniversal)}
      {renderSection(`━━ Conquistas de ${jogadorPosicao || "Posição"} ━━`, sortedPosition)}

      <AchievementDetailsModal
        playerAchievement={selectedAchievement}
        isOpen={!!selectedAchievement}
        onOpenChange={(open) => !open && setSelectedAchievement(null)}
      />
    </div>
  );
};
