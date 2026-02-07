import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogos } from "@/hooks/useData";
import { useTimeCasa } from "@/hooks/useTimes";
import { ConfirmacaoPresenca } from "@/components/ConfirmacaoPresenca";
import { statusLabels, type Jogo, type Time } from "@/lib/types";
import { cn } from "@/lib/utils";

function GameCard({ jogo, timeCasa }: { jogo: Jogo; timeCasa?: Time | null }) {
  const gameDate = new Date(jogo.data_hora);
  const isUpcoming = isFuture(gameDate);
  const time = jogo.time_adversario;
  
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={jogo.status === 'confirmado' ? 'default' : 'secondary'}>
                {statusLabels[jogo.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Escudo do time da casa */}
              {timeCasa?.escudo_url && (
                <img 
                  src={timeCasa.escudo_url} 
                  alt={timeCasa.nome} 
                  className="h-8 w-8 rounded-full object-contain"
                />
              )}
              <span className="text-sm text-muted-foreground font-medium">vs</span>
              {/* Escudo do adversário */}
              {time?.escudo_url && (
                <img 
                  src={time.escudo_url} 
                  alt={time.nome} 
                  className="h-8 w-8 rounded-full object-contain"
                />
              )}
            </div>
            <h3 className="mt-1 text-lg font-semibold">
              {timeCasa?.nome || 'Real Tralhas'} vs {time?.nome || jogo.adversario}
            </h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
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
            {/* Botão de confirmação de presença para jogos futuros */}
            {isUpcoming && jogo.status !== 'cancelado' && jogo.status !== 'finalizado' && (
              <div className="mt-3">
                <ConfirmacaoPresenca jogoId={jogo.id} compact />
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {format(gameDate, "dd")}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(gameDate, "MMM", { locale: ptBR })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: jogos, isLoading } = useJogos();
  const { data: timeCasa } = useTimeCasa();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const jogosDoMes = jogos?.filter((jogo) => {
    const jogoDate = new Date(jogo.data_hora);
    return isSameMonth(jogoDate, currentMonth);
  }).sort((a, b) => {
    return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
  }) || [];

  const getDayGames = (date: Date) => {
    return jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];
  };

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Agenda</h1>
          <p className="text-muted-foreground">Calendário de jogos do Real Tralhas</p>
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
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-colors",
                        isToday && "bg-primary text-primary-foreground",
                        hasGames && !isToday && "bg-card text-card-foreground border",
                        !hasGames && !isToday && "bg-secondary/30 hover:bg-secondary/50"
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Games list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Jogos em {format(currentMonth, "MMMM", { locale: ptBR })}
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : jogosDoMes.length > 0 ? (
              <div className="space-y-4">
                {jogosDoMes.map((jogo) => (
                  <GameCard key={jogo.id} jogo={jogo} timeCasa={timeCasa} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum jogo agendado para este mês.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
