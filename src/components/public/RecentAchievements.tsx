import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { AchievementDetailsModal } from "@/components/achievements/AchievementDetailsModal";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamSlug } from "@/hooks/useTeamSlug";

export function RecentAchievements({ teamId }: { teamId: string }) {
  const { basePath } = useTeamSlug();
  const { data: recent, isLoading } = useQuery({
    queryKey: ["team-recent-achievements", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_achievements")
        .select(`
          *,
          jogador:jogadores!inner(nome, apelido, foto_url, team_id),
          achievement:achievements(*)
        `)
        .eq('jogador.team_id', teamId)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as any[];
    }
  });

  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBadgeClick = (achievement: any) => {
    setSelectedAchievement(achievement);
    setIsModalOpen(true);
  };

  if (isLoading || !recent || recent.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Últimas Conquistas
        </h2>
        <Link to={`${basePath}/conquistas`}>
          <Button variant="ghost" size="sm" className="text-primary text-xs hover:bg-primary/10 gap-1 group">
            Ver Arena <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 px-1 snap-x">
        {recent.map((a, idx) => (
          <div key={idx} className="flex flex-col items-center shrink-0 w-24 snap-start">
            <AchievementBadge 
              slug={a.achievement?.slug || ""}
              tier={a.current_tier}
              size="sm"
              onClick={() => handleBadgeClick(a)}
            />
            <div className="mt-2 text-center w-full">
              <p className="text-[10px] font-black italic text-white truncate px-1 uppercase tracking-tighter">
                {a.jogador?.apelido || a.jogador?.nome || "Jogador"}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                {a.unlocked_at && format(new Date(a.unlocked_at), "dd/MM")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <AchievementDetailsModal 
        playerAchievement={selectedAchievement}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
}
