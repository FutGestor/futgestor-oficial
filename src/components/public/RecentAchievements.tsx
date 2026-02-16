import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
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
          jogador:jogadores(nome, apelido, foto_url),
          achievement:achievements(*)
        `)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[]; // TODO: Define Achievement type if needed, but removing one 'any' casting for now
    }
  });

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
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-y-10 gap-x-4">
        {recent.map((a, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <AchievementBadge 
              slug={a.achievement?.slug || ""}
              tier={a.current_tier}
              size="sm"
            />
            <div className="mt-2 text-center w-full">
              <p className="text-[11px] font-bold text-white truncate px-1">
                {a.jogador?.apelido || a.jogador?.nome || "Jogador"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {a.unlocked_at && format(new Date(a.unlocked_at), "dd/MM 'às' HH:mm")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
