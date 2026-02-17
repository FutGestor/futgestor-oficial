import React, { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  eachDayOfInterval, 
  startOfDay,
  startOfToday,
  startOfYear, 
  endOfYear, 
  isSameDay, 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityCalendarProps {
  jogadorId: string;
  teamId: string;
  year?: number;
}

export function ActivityCalendar({ jogadorId, teamId, year: initialYear = new Date().getFullYear() }: ActivityCalendarProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sincronizar com prop externo se mudar
  useEffect(() => {
    setCurrentYear(initialYear);
  }, [initialYear]);

  const { startDate, endDate, today } = useMemo(() => ({
    startDate: startOfYear(new Date(currentYear, 0, 1)),
    endDate: endOfYear(new Date(currentYear, 11, 31)),
    today: startOfToday()
  }), [currentYear]);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["player-activity", jogadorId, teamId, currentYear],
    enabled: !!jogadorId && !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogos")
        .select(`
          id,
          data_hora,
          resultados (
            id,
            gols_favor,
            gols_contra,
            estatisticas_partida (
              jogador_id,
              participou
            )
          )
        `)
        .eq("team_id", teamId)
        .gte("data_hora", `${currentYear}-01-01T00:00:00`)
        .lte("data_hora", `${currentYear}-12-31T23:59:59`);

      if (error) throw error;
      
      const gamesData: Record<string, { status: string; placar: string; date: Date }> = {};

      data?.forEach(jogo => {
        const gameDate = new Date(jogo.data_hora);
        const dateKey = format(gameDate, 'yyyy-MM-dd');
        
        const rawResultados = jogo.resultados;
        const resultado = Array.isArray(rawResultados) 
          ? rawResultados[0] 
          : rawResultados;
        
        let status: 'nao_jogou' | 'vitoria' | 'empate' | 'derrota' = 'nao_jogou';
        let playerPlayed = false;
        let placar = "";

        if (resultado) {
          const rawStats = (resultado as any)?.estatisticas_partida;
          const statsArray = Array.isArray(rawStats) ? rawStats : rawStats ? [rawStats] : [];

          playerPlayed = statsArray.some(
            ep => String(ep.jogador_id) === String(jogadorId) && ep.participou === true
          );
          
          if (playerPlayed) {
            if (resultado.gols_favor > resultado.gols_contra) status = 'vitoria';
            else if (resultado.gols_favor === resultado.gols_contra) status = 'empate';
            else status = 'derrota';
            placar = `${resultado.gols_favor}x${resultado.gols_contra}`;
          }
        } else {
          if (gameDate <= today) {
            status = 'nao_jogou';
          } else {
            return;
          }
        }

        const existing = gamesData[dateKey];
        const priority: Record<string, number> = { vitoria: 4, empate: 3, derrota: 2, nao_jogou: 1 };
        
        if (!existing || priority[status] > priority[existing.status]) {
          gamesData[dateKey] = {
            date: gameDate,
            status,
            placar
          };
        }
      });

      return gamesData;
    }
  });

  // Scroll inteligente para o mês atual ou mês do último jogo
  useEffect(() => {
    if (scrollContainerRef.current && activities) {
      const keys = Object.keys(activities);
      let targetMonth = new Date().getMonth();
      const isCurrentYear = currentYear === new Date().getFullYear();
      
      if (isCurrentYear) {
        // Para o ano atual, evitar scroll se for início do ano para não esconder Janeiro/Fevereiro
        // Só scrollamos se estivermos do mês 4 (Maio) em diante
        if (targetMonth < 4) targetMonth = 0;
        else targetMonth = targetMonth - 1; // Deixa o mês anterior visível para contexto
      } else if (keys.length > 0) {
        // Se houver jogos em outros anos, focar no mês do último jogo registrado
        const lastGameTime = Math.max(...keys.map(k => new Date(k).getTime()));
        const lastGameDate = new Date(lastGameTime);
        if (lastGameDate.getFullYear() === currentYear) {
          targetMonth = lastGameDate.getMonth();
        }
      } else {
        // Sem jogos em anos passados: ver final. Em anos futuros: ver início.
        targetMonth = currentYear < new Date().getFullYear() ? 11 : 0;
      }

      const scrollPercent = targetMonth / 11;
      const container = scrollContainerRef.current;
      
      // Timeout para garantir que o layout renderizou
      setTimeout(() => {
        if (container) {
          container.scrollLeft = (container.scrollWidth - container.clientWidth) * scrollPercent;
        }
      }, 100);
    }
  }, [activities, currentYear]);

  // Gerar todos os dias do ano organizados por semanas (estilo GitHub)
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const monthLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  if (isLoading) {
    return (
      <div className="w-full h-48 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse" />
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Quadro de Atividade — {currentYear}
          </h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={() => setCurrentYear(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-black italic text-white w-10 text-center">{currentYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={() => setCurrentYear(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar scroll-smooth"
          >
            <div className="flex flex-col min-w-[900px]">
            {/* Month Labels */}
            <div className="flex mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {monthLabels.map((month, i) => (
                <div key={i} className="flex-1 text-center">{month}</div>
              ))}
            </div>

            {/* Activity Grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day, i) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const activity = (activities as Record<string, any>)?.[dayKey];
                const isToday = isSameDay(day, today);
                
                let bgColor = "bg-transparent";
                let border = "border border-white/5";
                let label = "Sem jogo";

                if (activity) {
                  if (activity.status === 'vitoria') {
                    bgColor = "bg-blue-500";
                    border = "border-transparent";
                    label = `Vitória (${activity.placar})`;
                  } else if (activity.status === 'empate') {
                    bgColor = "bg-sky-300";
                    border = "border-transparent";
                    label = `Empate (${activity.placar})`;
                  } else if (activity.status === 'derrota') {
                    bgColor = "bg-purple-600";
                    border = "border-transparent";
                    label = `Derrota (${activity.placar})`;
                  } else if (activity.status === 'nao_jogou') {
                    bgColor = "bg-zinc-600";
                    border = "border-transparent";
                    label = `Não participou`;
                  }
                }

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-[2px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-default",
                          bgColor,
                          border,
                          isToday && "ring-2 ring-white/70 ring-offset-1 ring-offset-black z-20"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-white text-xs">
                      <p className="font-bold">{format(day, "d 'de' MMMM", { locale: ptBR })}</p>
                      <p className="text-zinc-400">{label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Legend - Melhorada para mobile */}
            <div className="mt-6 flex flex-wrap items-center justify-start sm:justify-end gap-x-3 gap-y-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 pr-2">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <div className="w-2.5 h-2.5 bg-transparent rounded-full border border-white/[0.05]" /> <span className="hidden xs:inline">Sem jogo</span><span className="xs:hidden">-</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <div className="w-2.5 h-2.5 bg-zinc-600 rounded-full" /> <span className="hidden xs:inline">Não jogou</span><span className="xs:hidden">NJ</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> <span className="hidden xs:inline">Vitória</span><span className="xs:hidden">V</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <div className="w-2.5 h-2.5 bg-sky-300 rounded-full" /> <span className="hidden xs:inline">Empate</span><span className="xs:hidden">E</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" /> <span className="hidden xs:inline">Derrota</span><span className="xs:hidden">D</span>
              </span>
            </div>
          </div>
        </div>
          
        {/* Scroll Indicator Gradient */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black/60 to-transparent pointer-events-none rounded-r-2xl sm:hidden" />
      </div>
    </div>
    </TooltipProvider>
  );
}
