import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Calendar, MapPin, Instagram, MessageCircle, Youtube, Facebook, Clock, ChevronLeft, ChevronRight as ChevronRightIcon, Trophy, TrendingUp, Bell, ChevronRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { statusLabels, type Jogo, type Time, categoryLabels, type Resultado } from "@/lib/types";
import { ScheduleGameCard } from "@/components/ScheduleGameCard";
import { useAvisos, useFinancialSummary, useUltimoResultado, useJogos, useResultados, useProximoJogo } from "@/hooks/useData";
import { useTimeCasa } from "@/hooks/useTimes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StickerAlbum } from "@/components/public/StickerAlbum";
// Featured Game Card Component
function FeaturedGameCard({ teamId }: { teamId: string }) {
  const { data: proximoJogo, isLoading: loadingNext } = useProximoJogo(teamId);
  const { data: ultimoResultado, isLoading: loadingLast } = useUltimoResultado(teamId);
  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();

  const isLoading = loadingNext || loadingLast;

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  // Prioridade: Próximo Jogo
  if (proximoJogo) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[#0F2440] p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="h-32 w-32" />
        </div>
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Próximo Jogo</Badge>
            <span className="text-sm text-gray-400">
               {format(new Date(proximoJogo.data_hora), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
             {/* Meu Time */}
             <div className="flex flex-col items-center gap-2">
                {team.escudo_url ? (
                  <img src={team.escudo_url} alt={team.nome} className="h-16 w-16 object-contain md:h-20 md:w-20" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                )}
                <span className="text-sm font-bold md:text-base text-center max-w-[80px] leading-tight">{team.nome}</span>
             </div>

             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-white/50">VS</span>
                <span className="text-xs text-gray-400">{format(new Date(proximoJogo.data_hora), "HH:mm")}</span>
             </div>

             {/* Adversário */}
             <div className="flex flex-col items-center gap-2">
                {proximoJogo.time_adversario?.escudo_url ? (
                  <img src={proximoJogo.time_adversario.escudo_url} alt={proximoJogo.time_adversario.nome} className="h-16 w-16 object-contain md:h-20 md:w-20" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <Trophy className="h-8 w-8" />
                  </div>
                )}
                <span className="text-sm font-bold md:text-base text-center max-w-[80px] leading-tight">
                  {proximoJogo.time_adversario?.nome || proximoJogo.adversario || "Adversário"}
                </span>
             </div>
          </div>
          
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-gray-400">
            <MapPin className="mr-1 inline h-4 w-4" />
            {proximoJogo.local}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Último Resultado
  if (ultimoResultado && ultimoResultado.jogo) {
     const golsFavor = ultimoResultado.gols_favor;
     const golsContra = ultimoResultado.gols_contra;
     const isVitoria = golsFavor > golsContra;
     const isDerrota = golsFavor < golsContra;
     const resultColor = isVitoria ? "text-green-400" : isDerrota ? "text-red-400" : "text-gray-200";

     return (
      <div className="relative overflow-hidden rounded-2xl bg-[#0F2440] p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="h-32 w-32" />
        </div>
        <div className="relative z-10">
           <div className="mb-4 flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-gray-300">Último Resultado</Badge>
            <span className="text-sm text-gray-400">
               {format(new Date(ultimoResultado.jogo.data_hora), "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-center gap-6">
             <span className="text-lg font-bold">{team.nome}</span>
             <div className={`text-4xl font-black ${resultColor}`}>
                {golsFavor} <span className="text-white/30 text-2xl mx-1">x</span> {golsContra}
             </div>
             <span className="text-lg font-bold">{ultimoResultado.jogo.adversario}</span>
          </div>
           
           <div className="mt-6 flex justify-center">
             <Link to={`${basePath}/resultados`}>
                <Button variant="link" className="text-white/80 hover:text-white h-auto p-0">
                    Ver histórico completo <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
             </Link>
           </div>
        </div>
      </div>
     );
  }

  // Fallback final: Sem dados
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
        <Calendar className="mx-auto h-10 w-10 opacity-20 mb-2" />
        <p>Ainda não há jogos agendados ou resultados.</p>
    </div>
  );
}

// Stats / Member Area
function MemberArea({ teamId, hasFinanceiro, hasAvisos }: { teamId: string, hasFinanceiro: boolean, hasAvisos: boolean }) {
    const { data: summary } = useFinancialSummary(teamId);
    const { data: avisos } = useAvisos(1, teamId);
    const { basePath } = useTeamSlug();
    const saldo = summary?.saldoAtual ?? 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasFinanceiro && (
                <Link to={`${basePath}/financeiro`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1 font-medium">Caixa do Time</p>
                                <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
                                    R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {hasAvisos && (
                <Link to={`${basePath}/avisos`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-muted-foreground font-medium">Mural de Avisos</p>
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {avisos && avisos.length > 0 ? (
                                <div>
                                    <p className="font-medium truncate">{avisos[0].titulo}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(avisos[0].created_at), "dd/MM")}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhum aviso irrelevante.</p>
                            )}
                        </CardContent>
                    </Card>
                </Link>
            )}
        </div>
    );
}

export default function TeamPublicPage() {
  const { team } = useTeamSlug();
  const { user, profile } = useAuth();
  const isMember = !!profile?.team_id && profile.team_id === team.id;
  const { hasSolicitacoes, hasFinanceiro, hasAvisos } = usePlanAccess(team.id);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[450px] md:min-h-[550px]">
        {team.banner_url && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${team.banner_url})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        
        <div className="container relative z-10 flex min-h-[450px] md:min-h-[550px] flex-col items-center justify-center px-4 md:px-6 pt-12 text-center">
             <h1
              className="mb-4 text-4xl font-black md:text-6xl drop-shadow-2xl text-[var(--title-color)] tracking-tight"
              style={{ "--title-color": team.bio_config?.titleColor || "#FFFFFF" } as React.CSSProperties}
            >
              {team.nome}
            </h1>
            
            <p className="mb-8 max-w-xl text-lg text-white/90 drop-shadow-lg leading-relaxed">
              {team.bio_config?.text || (isMember
                ? "Painel oficial do atleta. Acompanhe seus jogos e estatísticas."
                : "Bem-vindo à página oficial do nosso time.")}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {!user && (
                <Link to="/auth">
                  <Button size="lg" className="h-12 px-8 font-bold gap-2 bg-white text-black hover:bg-white/90 rounded-full">Entrar no Time</Button>
                </Link>
              )}
               {/* Social Icons simplified */}
               {team.redes_sociais?.instagram && (
                 <a href={team.redes_sociais.instagram} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm">
                    <Instagram className="h-6 w-6" />
                 </a>
               )}
            </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 -mt-16 relative z-20 space-y-12 mb-24">
        
        {/* 1. Featured Game (Floating over Hero) */}
        <section>
             <h2 className="sr-only">Destaque</h2>
             <div className="max-w-3xl mx-auto">
                <FeaturedGameCard teamId={team.id} />
             </div>
        </section>

        {/* 2. Member Area (If Member) */}
        {isMember && (hasFinanceiro || hasAvisos) && (
            <section className="max-w-3xl mx-auto">
                <MemberArea teamId={team.id} hasFinanceiro={hasFinanceiro} hasAvisos={hasAvisos} />
            </section>
        )}

        {/* 3. Sticker Album (Carousel) */}
        <section>
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Elenco
                </h2>
             </div>
             <StickerAlbum teamId={team.id} layout="carousel" />
        </section>
        
        {/* 4. Want to play? (Schedule) */}
        {hasSolicitacoes && (
            <section className="max-w-3xl mx-auto">
                <ScheduleGameCard teamId={team.id} />
            </section>
        )}

      </div>
    </Layout>
  );
}
