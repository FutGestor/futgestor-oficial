import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VotacaoDestaque } from "@/components/VotacaoDestaque";
import { useProximoJogo, useUltimoResultado, useResultados } from "@/hooks/useData";
import { TeamFormStreak } from "@/components/TeamFormStreak";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TeamShield } from "@/components/TeamShield";

export function FeaturedGameCard({ teamId }: { teamId: string }) {
  const { data: proximoJogo, isLoading: loadingNext } = useProximoJogo(teamId);
  const { data: ultimoResultado, isLoading: loadingLast } = useUltimoResultado(teamId);
  const { data: resultados, isLoading: loadingResults } = useResultados(teamId);
  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const jogadorId = profile?.jogador_id;

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
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    },
  });

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
  const isLoading = loadingNext || loadingLast || loadingResults;

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {resultados && resultados.length > 0 && (
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Momento Atual</span>
            <span className="text-xs font-bold text-white italic">Sequência de Forma</span>
          </div>
          <TeamFormStreak resultados={resultados} />
        </div>
      )}

      {proximoJogo && (
        <div className="relative overflow-hidden rounded-2xl bg-black/60 backdrop-blur-xl p-6 text-white shadow-xl border border-white/10">
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
                <TeamShield 
                  escudoUrl={team.escudo_url} 
                  teamName={team.nome} 
                  size="lg" 
                />
                <span className="text-sm font-bold md:text-base text-center max-w-[80px] leading-tight text-shadow-sm">{team.nome}</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <span className="text-2xl font-black text-white/50">VS</span>
                <span className="text-xs text-gray-400">{format(new Date(proximoJogo.data_hora), "HH:mm")}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <TeamShield 
                  escudoUrl={proximoJogo.time_adversario?.escudo_url || null} 
                  teamName={proximoJogo.time_adversario?.nome || proximoJogo.adversario} 
                  size="lg" 
                />
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

      {ultimoResultado && ultimoResultado.jogo && (
        <Card className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl text-foreground shadow-xl soft-shadow rounded-2xl">
          <CardHeader className="pb-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 font-bold uppercase tracking-widest text-muted-foreground">🏁 Último Resultado</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-6 py-2">
              <div className="flex w-full items-center justify-between px-2 md:px-8">
                <div className="flex flex-col items-center gap-3">
                  <TeamShield 
                    escudoUrl={team?.escudo_url} 
                    teamName={team.nome} 
                    size="lg" 
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center max-w-[100px] leading-tight">
                    {team.nome}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className="text-4xl md:text-6xl font-black text-foreground drop-shadow-sm">{ultimoResultado.gols_favor}</span>
                    <span className="text-xl md:text-2xl font-bold text-muted-foreground italic">X</span>
                    <span className="text-4xl md:text-6xl font-black text-foreground drop-shadow-sm">{ultimoResultado.gols_contra}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <TeamShield 
                    escudoUrl={ultimoResultado.jogo.time_adversario?.escudo_url || null} 
                    teamName={ultimoResultado.jogo.adversario} 
                    size="lg" 
                  />
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
