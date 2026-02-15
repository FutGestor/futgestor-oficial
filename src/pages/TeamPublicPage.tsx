import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Calendar, MapPin, Instagram, MessageCircle, Youtube, Facebook, Clock, ChevronLeft, ChevronRight as ChevronRightIcon, Trophy, TrendingUp, Bell, ChevronRight, Users, Send } from "lucide-react";
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
import { cn } from "../lib/utils";
import { StickerAlbum } from "@/components/public/StickerAlbum";
import { VotacaoDestaque } from "@/components/VotacaoDestaque";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { supabase } from "@/integrations/supabase/client";
import { ESCUDO_PADRAO } from "@/lib/constants";
// Featured Game Card Component
function FeaturedGameCard({ teamId }: { teamId: string }) {
  const { data: proximoJogo, isLoading: loadingNext } = useProximoJogo(teamId);
  const { data: ultimoResultado, isLoading: loadingLast } = useUltimoResultado(teamId);
  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const jogadorId = profile?.jogador_id;

  // Mutation para confirmar presença (Copiado do PlayerDashboard)
  const confirmarPresenca = useMutation({
    mutationFn: async (status: "confirmado" | "indisponivel") => {
      if (!proximoJogo) return;
      const { error } = await supabase.from("confirmacoes_presenca").upsert(
        {
          jogo_id: proximoJogo.id,
          jogador_id: jogadorId!,
          status,
          team_id: teamId,
        },
        { onConflict: "jogo_id,jogador_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-confirmacao"] });
      toast({ title: "Presença atualizada!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    },
  });

  // Query para status de presença
  const { data: confirmacao } = useQuery({
    queryKey: ["player-confirmacao", proximoJogo?.id, jogadorId],
    enabled: !!proximoJogo?.id && !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmacoes_presenca")
        .select("*")
        .eq("jogo_id", proximoJogo!.id)
        .eq("jogador_id", jogadorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const currentStatus = confirmacao?.status;

  const isLoading = loadingNext || loadingLast;

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Próximo Jogo */}
      {proximoJogo && (
        <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl p-6 text-white shadow-xl border border-white/10">
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
              <div className="flex flex-col items-center gap-2">
                <img src={team.escudo_url || ESCUDO_PADRAO} alt={team.nome} className="h-16 w-16 object-contain md:h-20 md:w-20" />
                <span className="text-sm font-bold md:text-base text-center max-w-[80px] leading-tight text-shadow-sm">{team.nome}</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <span className="text-2xl font-black text-white/50">VS</span>
                <span className="text-xs text-gray-400">{format(new Date(proximoJogo.data_hora), "HH:mm")}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <img src={proximoJogo.time_adversario?.escudo_url || ESCUDO_PADRAO} alt={proximoJogo.time_adversario?.nome || proximoJogo.adversario} className="h-16 w-16 object-contain md:h-20 md:w-20" />
                  <span className="text-sm font-bold md:text-base text-center max-w-[80px] leading-tight text-shadow-sm">
                    {proximoJogo.time_adversario?.nome || proximoJogo.adversario || "Adversário"}
                  </span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  {proximoJogo.local}
                </div>
                
                {jogadorId && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => confirmarPresenca.mutate("confirmado")}
                      disabled={confirmarPresenca.isPending || currentStatus === "confirmado"}
                      variant={currentStatus === "confirmado" ? "secondary" : "default"}
                      className={cn(currentStatus === "confirmado" && "bg-green-500/20 text-green-400 border-green-500/20")}
                    >
                      {currentStatus === "confirmado" ? "Confirmado ✓" : "Vou"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmarPresenca.mutate("indisponivel")}
                      disabled={confirmarPresenca.isPending || currentStatus === "indisponivel"}
                      className={cn(
                        "border-white/20 text-white/80 bg-white/5 hover:bg-white/10 hover:text-white", 
                        currentStatus === "indisponivel" && "bg-red-500/20 text-red-400 border-red-500/20"
                      )}
                    >
                      Não vou
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Último Resultado - Design Adaptativo */}
      {ultimoResultado && ultimoResultado.jogo && (
        <Card className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl text-foreground shadow-xl soft-shadow rounded-2xl">
          <CardHeader className="pb-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">🏁 Último Resultado</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-6 py-2">
              <div className="flex w-full items-center justify-between px-2 md:px-8">
                {/* Time da Casa */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted/50 p-3 flex items-center justify-center border border-border shadow-inner">
                    <img src={team?.escudo_url || ESCUDO_PADRAO} alt="" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center max-w-[100px] leading-tight">
                    {team.nome}
                  </span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className="text-4xl md:text-6xl font-black text-foreground drop-shadow-sm">{ultimoResultado.gols_favor}</span>
                    <span className="text-xl md:text-2xl font-bold text-muted-foreground italic">X</span>
                    <span className="text-4xl md:text-6xl font-black text-foreground drop-shadow-sm">{ultimoResultado.gols_contra}</span>
                  </div>
                </div>

                {/* Adversário */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted/50 p-3 flex items-center justify-center border border-border shadow-inner">
                    <img src={ultimoResultado.jogo.time_adversario?.escudo_url || ESCUDO_PADRAO} alt="" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center max-w-[100px] leading-tight">
                    {ultimoResultado.jogo.adversario}
                  </span>
                </div>
              </div>

              <div className="w-full border-t border-white/10 pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground bg-black/20 px-3 py-1 rounded-full border border-white/10">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(ultimoResultado.jogo.data_hora), "dd 'de' MMMM", { locale: ptBR })}
                  </div>

                  <div className="w-full">
                    <VotacaoDestaque resultadoId={ultimoResultado.id} />
                  </div>

                  <Link to={`${basePath}/resultados`} className="mt-2 text-center">
                    <Button variant="link" className="text-muted-foreground hover:text-primary h-auto p-0 text-xs gap-1 group">
                      Ver Histórico Completo 
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!proximoJogo && (!ultimoResultado || !ultimoResultado.jogo) && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 backdrop-blur-sm p-8 text-center text-slate-400">
          <Calendar className="mx-auto h-10 w-10 opacity-20 mb-2" />
          <p>Nenhum compromisso ou resultado recente.</p>
        </div>
      )}
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
                    <Card className="bg-black/40 backdrop-blur-xl border-white/10 hover:bg-black/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1 font-medium">Caixa do Time</p>
                                <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
                                    R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {hasAvisos && (
                <Link to={`${basePath}/avisos`}>
                    <Card className="bg-black/40 backdrop-blur-xl border-white/10 hover:bg-black/50 transition-colors cursor-pointer h-full">
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
                                <p className="text-sm text-muted-foreground">Nenhum aviso no momento.</p>
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
      {/* Home Title Section (Triple A Refinement) */}
      <section className="relative pt-24 pb-12 flex flex-col items-center justify-center text-center container px-4">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img 
            src={team.escudo_url || ESCUDO_PADRAO} 
            alt={team.nome} 
            className="h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-[0_0_20px_rgba(230,179,37,0.3)] animate-in zoom-in duration-700" 
          />
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span className="text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]">{team.nome.split(' ')[0]}</span>
            {team.nome.split(' ').slice(1).length > 0 && (
              <span className="text-primary drop-shadow-[0_4px_12px_rgba(230,179,37,0.4)]">
                {team.nome.split(' ').slice(1).join(' ')}
              </span>
            )}
          </h1>
        </div>
        
        <p className="max-w-2xl text-muted-foreground text-lg md:text-xl font-medium leading-relaxed mb-8 mt-4 text-shadow-sm">
          {team.bio_config?.text || "Vai encarar? Agende um jogo hoje mesmo"}
        </p>

        <div className="flex flex-wrap justify-center gap-4 items-center">
          {!user && (
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 font-black uppercase italic tracking-widest bg-primary text-black hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/20">
                Entrar no Time
              </Button>
            </Link>
          )}

          <div className="flex gap-3">
            {team.redes_sociais?.instagram && (
              <a 
                href={team.redes_sociais.instagram.startsWith('http') ? team.redes_sociais.instagram : `https://instagram.com/${team.redes_sociais.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 rounded-xl bg-gradient-to-br from-[#E1306C]/20 to-[#405DE6]/20 border border-white/10 hover:border-primary/50 text-white transition-all backdrop-blur-xl group"
                title="Instagram"
              >
                <Instagram className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </a>
            )}
            {team.redes_sociais?.whatsapp && (
              <a 
                href={team.redes_sociais.whatsapp.startsWith('http') ? team.redes_sociais.whatsapp : `https://wa.me/${team.redes_sociais.whatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 rounded-xl bg-green-500/10 border border-white/10 hover:border-green-500/50 text-white transition-all backdrop-blur-xl group"
                title="WhatsApp"
              >
                <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform text-green-400" />
              </a>
            )}
            <Button 
                variant="outline" 
                className="p-4 h-auto rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-xl"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copiado!", description: "Compartilhe o perfil do seu time." });
                }}
            >
              <Send className="h-6 w-6" />
            </Button>
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
