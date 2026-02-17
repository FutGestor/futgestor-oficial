import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Circle, 
  Target, 
  UserPlus, 
  CalendarPlus, 
  Trophy, 
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeamSlug } from "@/hooks/useTeamSlug";

interface OnboardingChecklistProps {
  teamId: string;
  escudoUrl: string | null;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ teamId, escudoUrl }) => {
  const navigate = useNavigate();
  const { slug: teamSlug, basePath } = useTeamSlug();
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem(`futgestor-onboarding-minimized-${teamId}`) === 'true';
  });

  const handleMinimize = () => {
    const newState = !isMinimized;
    sessionStorage.setItem(`futgestor-onboarding-minimized-${teamId}`, String(newState));
    setIsMinimized(newState);
  };

  const { data: resultCount = 0, isLoading: loadingResults } = useQuery({
    queryKey: ["onboarding-results", teamId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("resultados")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", teamId);
      if (error) throw error;
      return count || 0;
    }
  });

  // Queries para verificar o progresso
  const { data: playerCount = 0, isLoading: loadingPlayers } = useQuery({
    queryKey: ["onboarding-players", teamId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("jogadores")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", teamId);
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: gameCount = 0, isLoading: loadingGames } = useQuery({
    queryKey: ["onboarding-games", teamId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("jogos")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", teamId);
      if (error) throw error;
      return count || 0;
    }
  });

  if (loadingPlayers || loadingGames || loadingResults) {
    return null; // Don't show anything while determining status
  }

  const missions = [
    {
      id: "identity",
      label: "Personalizar identidade",
      description: "Adicione o escudo oficial do seu time",
      isComplete: !!escudoUrl,
      icon: Target,
      path: "/meu-perfil", // A tab Clube é acessada via tab param ou estado no perfil
    },
    {
      id: "players",
      label: "Convidar primeiro jogador",
      description: "Chame seus atletas para o FutGestor",
      isComplete: playerCount > 0,
      icon: UserPlus,
      path: "/jogadores/gerenciar",
    },
    {
      id: "games",
      label: "Criar primeiro jogo",
      description: "Agende sua primeira partida na agenda",
      isComplete: gameCount > 0,
      icon: CalendarPlus,
      path: "/agenda/gerenciar",
    },
    {
      id: "results",
      label: "Registrar primeiro resultado",
      description: "Lance os gols e estatísticas da partida",
      isComplete: resultCount > 0,
      icon: Trophy,
      path: "/agenda/gerenciar",
    }
  ];

  const completedCount = missions.filter(m => m.isComplete).length;
  const progressPercent = (completedCount / missions.length) * 100;
  const allComplete = completedCount === missions.length;

   if (allComplete) return null;

  if (isMinimized) {
    return (
      <Card 
        className="bg-black/60 backdrop-blur-xl border-primary/30 border-dashed rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500 cursor-pointer hover:bg-black/80 transition-all group"
        onClick={handleMinimize}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl animate-bounce">🎯</span>
            <p className="text-[11px] font-black uppercase tracking-wider text-primary group-hover:text-white transition-colors">
              Complete as tarefas para desbloquear o potencial do time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-500 italic">
              {completedCount}/{missions.length}
            </span>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary group-hover:scale-110 transition-transform"
            >
                <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur-xl border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span> Primeiros Passos
            </h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Complete para desbloquear todo o potencial do time
            </p>
          </div>
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full"
            onClick={handleMinimize}
            title="Minimizar tarefas"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Progresso Geral
            </span>
            <span className="text-xs font-black italic text-primary">
              {completedCount} de {missions.length} completas
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/5" indicatorClassName="bg-gradient-to-r from-primary to-cyan-400" />
        </div>

        <div className="grid gap-3">
          {missions.map((mission) => (
            <div 
              key={mission.id}
              className={cn(
                "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                mission.isComplete 
                  ? "bg-white/[0.02] border-white/5" 
                  : "bg-white/5 border-white/10 hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                  mission.isComplete 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-white/5 text-zinc-400 group-hover:text-primary"
                )}>
                  <mission.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className={cn(
                    "text-sm font-bold transition-all",
                    mission.isComplete ? "text-zinc-500 line-through" : "text-white"
                  )}>
                    {mission.label}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium">{mission.description}</p>
                </div>
              </div>

              {mission.isComplete ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Concluído</span>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-primary gap-2 transition-all"
                  onClick={() => navigate(`${basePath}${mission.path}`)}
                >
                  Fazer <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
