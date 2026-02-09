import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Calendar, MapPin, Instagram, MessageCircle, Youtube, Facebook, Clock, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { statusLabels, type Jogo, type Time } from "@/lib/types";
import { ScheduleGameCard } from "@/components/ScheduleGameCard";
import { useAvisos, useFinancialSummary, useUltimoResultado, useJogos } from "@/hooks/useData";
import { useTimeCasa } from "@/hooks/useTimes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { Trophy, TrendingUp, Bell, ChevronRight } from "lucide-react";
import { categoryLabels } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


function LastResultCard() {
  const { data: resultado, isLoading } = useUltimoResultado();
  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-16 w-full" /></CardContent>
      </Card>
    );
  }

  if (!resultado || !resultado.jogo) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            Último Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum resultado registrado.</p>
        </CardContent>
      </Card>
    );
  }

  const golsFavor = resultado.gols_favor;
  const golsContra = resultado.gols_contra;
  const isVitoria = golsFavor > golsContra;
  const isDerrota = golsFavor < golsContra;
  const resultadoColor = isVitoria ? "text-green-600" : isDerrota ? "text-destructive" : "text-muted-foreground";
  const bgColor = isVitoria ? "bg-green-50 dark:bg-green-950/30" : isDerrota ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50";

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Trophy className="h-5 w-5" />
          Último Resultado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`rounded-lg p-4 ${bgColor}`}>
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4">
            <span className="text-lg font-semibold">{team.nome}</span>
            <span className={`whitespace-nowrap text-2xl font-bold ${resultadoColor}`}>
              {golsFavor} x {golsContra}
            </span>
            <span className="text-lg font-semibold">{resultado.jogo.adversario}</span>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {format(new Date(resultado.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link to={`${basePath}/resultados`} className="mt-4 block">
          <Button variant="outline" className="w-full">
            Ver todos os resultados
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function FinancialCard() {
  const { data: summary, isLoading } = useFinancialSummary();
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-16 w-full" /></CardContent>
      </Card>
    );
  }

  const saldo = summary?.saldoAtual ?? 0;

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          Saldo do Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <span className={`text-3xl font-bold ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
            R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <p className="mt-1 text-sm text-muted-foreground">Saldo atual da caixinha</p>
        </div>
        <Link to={`${basePath}/financeiro`} className="mt-4 block">
          <Button variant="outline" className="w-full">
            Ver detalhes
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function NoticesCard() {
  const { data: avisos, isLoading } = useAvisos(3);
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bell className="h-5 w-5" />
          Últimos Avisos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {avisos && avisos.length > 0 ? (
          <div className="space-y-3">
            {avisos.map((aviso) => (
              <div key={aviso.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={aviso.categoria === "urgente" ? "destructive" : "secondary"}>
                    {categoryLabels[aviso.categoria]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(aviso.created_at), "dd/MM/yyyy")}
                  </span>
                </div>
                <h4 className="font-medium">{aviso.titulo}</h4>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum aviso no momento.</p>
        )}
        <Link to={`${basePath}/avisos`} className="mt-4 block">
          <Button variant="outline" className="w-full">
            Ver todos
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function AgendaGameCard({ jogo, timeCasa }: { jogo: Jogo; timeCasa?: Time | null }) {
  const gameDate = new Date(jogo.data_hora);
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
              {timeCasa?.escudo_url && (
                <img src={timeCasa.escudo_url} alt={timeCasa.nome} className="h-8 w-8 rounded-full object-contain" />
              )}
              <span className="text-sm text-muted-foreground font-medium">vs</span>
              {time?.escudo_url && (
                <img src={time.escudo_url} alt={time.nome} className="h-8 w-8 rounded-full object-contain" />
              )}
            </div>
            <h3 className="mt-1 text-lg font-semibold">
              {timeCasa?.nome || 'Meu Time'} vs {time?.nome || jogo.adversario}
            </h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
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
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{format(gameDate, "dd")}</div>
            <div className="text-sm text-muted-foreground">{format(gameDate, "MMM", { locale: ptBR })}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaSection({ teamId }: { teamId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: jogos, isLoading } = useJogos(teamId);
  const { data: timeCasa } = useTimeCasa(teamId);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });


  const getDayGames = (date: Date) => {
    return jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];
  };

  return (
    <section className="py-8">
      <div className="container px-4 md:px-6">
        <h2 className="mb-6 text-2xl font-bold">Agenda</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 self-start">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {monthDays.map((day) => {
                  const dayGames = getDayGames(day);
                  const hasGames = dayGames.length > 0;
                  const isToday = isSameDay(day, new Date());
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
                      {(!hasGames || !time?.escudo_url) && (
                        <span className={cn("absolute left-1 top-0.5 text-[10px] font-medium z-10", hasGames && "font-bold")}>
                          {format(day, "d")}
                        </span>
                      )}
                      {hasGames && time?.escudo_url && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          <img src={time.escudo_url} alt={time.nome || firstGame.adversario} className="h-full w-full rounded-full object-contain" />
                        </div>
                      )}
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

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Jogos da semana
            </h3>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (() => {
              const now = new Date();
              const weekStart = startOfWeek(now, { weekStartsOn: 0 });
              const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
              const jogosDaSemana = (jogos ?? [])
                .filter((jogo) => {
                  const d = new Date(jogo.data_hora);
                  return d >= weekStart && d <= weekEnd;
                })
                .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

              return jogosDaSemana.length > 0 ? (
                <div className="space-y-4">
                  {jogosDaSemana.map((jogo) => (
                    <AgendaGameCard key={jogo.id} jogo={jogo} timeCasa={timeCasa} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum jogo nesta semana.
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TeamPublicPage() {
  const { team } = useTeamSlug();
  const { user, profile } = useAuth();
  const isMember = !!profile?.team_id && profile.team_id === team.id;
  const { hasFinanceiro, hasAvisos, hasSolicitacoes } = usePlanAccess(team.id);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
        {team.banner_url && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${team.banner_url})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/20" />
        <div className="container relative z-10 flex min-h-[500px] md:min-h-[600px] items-center justify-center px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">{team.nome}</h1>
            <p className="mb-8 max-w-2xl text-lg text-white/80">
              {isMember
                ? "Gerencie seu time de futebol. Agenda, escalações, resultados, finanças e muito mais em um só lugar."
                : "Bem-vindo à página do time. Faça login para acessar todas as funcionalidades."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {!user && (
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="gap-2">Entrar</Button>
                </Link>
              )}
              {team.redes_sociais?.instagram && (
                <a href={team.redes_sociais.instagram} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Instagram className="h-5 w-5" /> Instagram
                  </Button>
                </a>
              )}
              {team.redes_sociais?.whatsapp && (
                <a href={team.redes_sociais.whatsapp.startsWith('http') ? team.redes_sociais.whatsapp : `https://${team.redes_sociais.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 bg-green-600 text-white hover:bg-green-700">
                    <MessageCircle className="h-5 w-5" /> WhatsApp
                  </Button>
                </a>
              )}
              {team.redes_sociais?.youtube && (
                <a href={team.redes_sociais.youtube} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Youtube className="h-5 w-5" /> YouTube
                  </Button>
                </a>
              )}
              {team.redes_sociais?.facebook && (
                <a href={team.redes_sociais.facebook} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Facebook className="h-5 w-5" /> Facebook
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Agendamento - público para planos com solicitações */}
      {hasSolicitacoes && (
        <section className="py-8 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <ScheduleGameCard teamId={team.id} />
          </div>
        </section>
      )}

      {/* Agenda pública - sempre visível */}
      <AgendaSection teamId={team.id} />

      {/* Cards de membros */}
      {isMember && (
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <LastResultCard />
              {hasFinanceiro && <FinancialCard />}
              {hasAvisos && <NoticesCard />}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
