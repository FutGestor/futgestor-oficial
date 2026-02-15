import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogos, useResultados } from "@/hooks/useData";
import { useTimeCasa } from "@/hooks/useTimes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { statusLabels, type Jogo, type Time, type Resultado } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";


function GameCard({ jogo, timeCasa, resultado }: { jogo: Jogo; timeCasa?: Time | null; resultado?: Resultado | null }) {
  const gameDate = new Date(jogo.data_hora);
  const time = jogo.time_adversario;

  const isFinalizado = jogo.status === 'finalizado' && resultado;
  const golsFavor = resultado?.gols_favor ?? 0;
  const golsContra = resultado?.gols_contra ?? 0;

  const isVitoria = isFinalizado && golsFavor > golsContra;
  const isDerrota = isFinalizado && golsFavor < golsContra;

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10 transition-all hover:scale-[1.01]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={jogo.status === 'confirmado' ? 'default' : jogo.status === 'finalizado' ? 'secondary' : 'outline'}>
                {statusLabels[jogo.status]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time da Casa */}
              <div className="flex items-center gap-2">
                {timeCasa?.escudo_url && (
                  <img src={timeCasa.escudo_url} alt={timeCasa.nome} className="h-8 w-8 rounded-full object-contain" />
                )}
                <span className={cn("font-semibold", isFinalizado && "hidden sm:inline")}>
                  {timeCasa?.nome || 'Meu Time'}
                </span>
              </div>

              {/* Placar ou VS */}
              <div className="flex flex-col items-center min-w-[60px]">
                {isFinalizado ? (
                  <div className={cn(
                    "px-3 py-1 rounded text-lg font-bold whitespace-nowrap",
                    isVitoria ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    isDerrota ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}>
                    {golsFavor} x {golsContra}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">vs</span>
                )}
              </div>

              {/* Adversário */}
              <div className="flex items-center gap-2">
                {time?.escudo_url && (
                  <img src={time.escudo_url} alt={time.nome} className="h-8 w-8 rounded-full object-contain" />
                )}
                <span className={cn("font-semibold", isFinalizado && "hidden sm:inline")}>
                  {time?.nome || jogo.adversario}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {format(gameDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(gameDate, "HH:mm")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {jogo.local}
              </span>
            </div>
            {jogo.observacoes && (
              <p className="mt-2 text-sm text-muted-foreground">{jogo.observacoes}</p>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-foreground">
              {format(gameDate, "dd")}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {format(gameDate, "MMM", { locale: ptBR })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { team, basePath } = useTeamSlug();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: jogos, isLoading } = useJogos(team.id || undefined);
  const { data: resultados } = useResultados(team.id || undefined);
  const { data: timeCasa } = useTimeCasa(team.id || undefined);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayGames = (date: Date) => {
    return jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];
  };

  const jogosDoMes = jogos?.filter((jogo) => {
    const jogoDate = new Date(jogo.data_hora);
    return isSameMonth(jogoDate, currentMonth);
  }).sort((a, b) => {
    return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
  }) || [];

  const jogosFiltrados = selectedDate 
    ? jogos?.filter(j => isSameDay(new Date(j.data_hora), selectedDate)).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()) || []
    : jogosDoMes;

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Calendário de jogos do time</p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => navigate(`${basePath}/agenda/gerenciar`)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar Agenda
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2 self-start">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthDays.map((day) => {
                  const dayGames = getDayGames(day);
                  const hasGames = dayGames.length > 0;
                  const isToday = isSameDay(day, new Date());

                  // Pegar o primeiro jogo do dia para exibir o escudo
                  const firstGame = dayGames[0];
                  const time = firstGame?.time_adversario;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)}
                      className={cn(
                        "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                        isToday && !selectedDate && "bg-primary text-primary-foreground",
                        selectedDate && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary",
                        hasGames && !isToday && (!selectedDate || !isSameDay(day, selectedDate)) && "bg-transparent text-card-foreground border hover:bg-transparent/80",
                        !hasGames && !isToday && (!selectedDate || !isSameDay(day, selectedDate)) && "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground"
                      )}
                    >
                      {/* Numero do dia - escondido se tiver escudo */}
                      {(!hasGames || !time?.escudo_url) && (
                        <span className={cn(
                          "absolute left-1 top-0.5 text-[10px] font-medium z-10",
                          hasGames && "font-bold"
                        )}>
                          {format(day, "d")}
                        </span>
                      )}

                      {/* Escudo circular centralizado */}
                      {hasGames && time?.escudo_url && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          <img
                            src={time.escudo_url}
                            alt={time.nome || firstGame.adversario}
                            className="h-full w-full rounded-full object-contain"
                          />
                        </div>
                      )}

                      {/* Abreviação do time (posicionada abaixo do número) */}
                      {hasGames && !time?.escudo_url && (
                        <div className="absolute inset-0 flex items-center justify-center pt-3">
                          <span className="text-xs font-bold uppercase">
                            {(time?.apelido || time?.nome || firstGame?.adversario || "").substring(0, 3)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Games list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold">
                {selectedDate 
                  ? `Jogos em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                  : `Jogos em ${format(currentMonth, "MMMM", { locale: ptBR })}`
                }
              </h2>
              {selectedDate && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDate(null)}
                >
                  Ver mês inteiro
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : jogosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {jogosFiltrados.map((jogo) => {
                  const resultado = resultados?.find(r => r.jogo_id === jogo.id);
                  return (
                    <GameCard key={jogo.id} jogo={jogo} timeCasa={timeCasa} resultado={resultado} />
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum jogo agendado para {selectedDate ? "esta data" : "este mês"}.
                  {selectedDate && (
                    <div className="mt-4">
                      <Button variant="link" onClick={() => setSelectedDate(null)}>
                        Ver jogos do mês
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AgendaPage() {
  return <AgendaContent />;
}
