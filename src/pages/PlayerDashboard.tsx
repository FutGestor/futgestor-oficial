import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, Calendar, MapPin, CheckCircle2, AlertCircle, 
  Loader2, ArrowLeft, Trophy, Star, Plus, DollarSign, Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VotacaoDestaque } from "@/components/VotacaoDestaque";
import { cn } from "@/lib/utils";
import { TeamShield } from "@/components/TeamShield";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function usePlayerData() {
  const { profile } = useAuth();
  const jogadorId = profile?.jogador_id;
  const teamId = profile?.team_id;

  // Fetch jogador info
  const jogador = useQuery({
    queryKey: ["player-jogador", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select("*")
        .eq("id", jogadorId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch team info
  const team = useQuery({
    queryKey: ["player-team", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("nome, escudo_url, slug")
        .eq("id", teamId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch player financial balance
  const financeiro = useQuery({
    queryKey: ["player-financeiro", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_financeiro" as any)
        .select("*")
        .eq("jogador_id", jogadorId!);
      if (error) throw error;
      const items = data as any[];
      const totalDevido = items
        .filter((t: any) => t.tipo === "entrada" && !t.pago)
        .reduce((acc: number, t: any) => acc + Number(t.valor), 0);
      return { totalDevido, items };
    },
  });

  // Fetch next game
  const proximoJogo = useQuery({
    queryKey: ["player-proximo-jogo", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("jogos")
        .select("*, time_adversario:times(*)")
        .eq("team_id", teamId!)
        .gte("data_hora", today.toISOString())
        .in("status", ["agendado", "confirmado"])
        .order("data_hora", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch last finished game
  const ultimoJogo = useQuery({
    queryKey: ["player-ultimo-jogo", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogos")
        .select("*, resultados(*), time_adversario:times(*)")
        .eq("team_id", teamId!)
        .eq("status", "finalizado")
        .order("data_hora", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch player's confirmation for next game
  const confirmacao = useQuery({
    queryKey: ["player-confirmacao", proximoJogo.data?.id, jogadorId],
    enabled: !!proximoJogo.data?.id && !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmacoes_presenca")
        .select("*")
        .eq("jogo_id", proximoJogo.data!.id)
        .eq("jogador_id", jogadorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return { jogador, team, financeiro, proximoJogo, ultimoJogo, confirmacao, jogadorId, teamId };
}

export default function PlayerDashboard() {
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { jogador, team, financeiro, proximoJogo, ultimoJogo, confirmacao, jogadorId, teamId } = usePlayerData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const confirmarPresenca = useMutation({
    mutationFn: async (status: "confirmado" | "indisponivel") => {
      const { error } = await supabase.from("confirmacoes_presenca").upsert(
        {
          jogo_id: proximoJogo.data!.id,
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (authLoading || jogador.isLoading || team.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.jogador_id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4 text-center">
        <FutGestorLogo className="mb-4 h-16 w-16" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="mt-2 text-muted-foreground">Sua conta não está vinculada a nenhum jogador.</p>
        <Button onClick={handleSignOut} variant="outline" className="mt-4">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    );
  }

  const jogadorData = jogador.data;
  const teamData = team.data;
  const jogo = proximoJogo.data;
  const saldoDevedor = financeiro.data?.totalDevido ?? 0;
  const currentStatus = confirmacao.data?.status;

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(teamData?.slug ? `/time/${teamData.slug}` : "/")}
              title="Voltar ao Time"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {jogadorData?.foto_url ? (
              <img src={jogadorData.foto_url} alt="" className="h-12 w-12 rounded-full object-cover border border-border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {jogadorData?.numero || jogadorData?.nome?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {jogadorData?.apelido || jogadorData?.nome}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {teamData?.escudo_url && (
                  <TeamShield 
                    escudoUrl={teamData.escudo_url} 
                    teamName={teamData.nome} 
                    size="xs" 
                  />
                )}
                {teamData?.nome}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 space-y-6 p-4 pb-20">
        {/* Card Último Jogo (Destaque) */}
        {ultimoJogo.data && (
          <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-400">🏁 Último Resultado</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4 py-2">
                <div className="flex w-full items-center justify-between px-4">
                    <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/5">
                       <TeamShield 
                         escudoUrl={teamData?.escudo_url || null} 
                         teamName={teamData?.nome || "Seu Time"} 
                         size="lg"
                         className="h-full w-full border-0 shadow-none bg-transparent"
                       />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{teamData?.nome || "Seu Time"}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black text-white">{ultimoJogo.data.resultados?.[0]?.gols_favor ?? 0}</span>
                    <span className="text-lg font-bold text-slate-500">X</span>
                    <span className="text-4xl font-black text-white">{ultimoJogo.data.resultados?.[0]?.gols_contra ?? 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/5 overflow-hidden">
                       <TeamShield 
                         escudoUrl={ultimoJogo.data.time_adversario?.escudo_url || null} 
                         teamName={ultimoJogo.data.time_adversario?.nome || ultimoJogo.data.adversario} 
                         size="lg"
                         className="h-full w-full border-0 shadow-none bg-transparent"
                       />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate max-w-[80px]">
                      {ultimoJogo.data.time_adversario?.nome || (ultimoJogo.data.time_adversario as any)?.adversary_team?.nome || ultimoJogo.data.adversario}
                    </span>
                  </div>
                </div>

                <div className="w-full border-t border-white/5 pt-4">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(ultimoJogo.data.data_hora), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  
                  {ultimoJogo.data.resultados?.[0]?.id && (
                    <VotacaoDestaque resultadoId={ultimoJogo.data.resultados[0].id} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Card Financeiro */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">💰 Situação Financeira</h2>
            {financeiro.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : saldoDevedor > 0 ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold text-destructive">
                  R$ {saldoDevedor.toFixed(2).replace(".", ",")}
                </span>
                <Badge variant="destructive" className="text-xs">Pendente</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-xl font-bold text-green-500">Em dia ✅</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Conquistas (Gamificação) */}
        <Card className="bg-black/20 border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-300">🏅 Suas Conquistas</CardTitle>
              <Trophy className="h-4 w-4 text-primary opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {jogadorId && <AchievementGrid jogadorId={jogadorId} jogadorPosicao={jogador.data?.posicao} />}
          </CardContent>
        </Card>

        {/* Card Próximo Jogo */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">⚽ Próximo Jogo</h2>
            {proximoJogo.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : jogo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 mb-3">
                  <TeamShield 
                    escudoUrl={jogo.time_adversario?.escudo_url || null} 
                    teamName={jogo.time_adversario?.nome || jogo.adversario} 
                    size="lg" 
                  />
                  <div>
                    <p className="text-lg font-bold">{jogo.time_adversario?.nome || (jogo.time_adversario as any)?.adversary_team?.nome || jogo.adversario}</p>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5 border-white/5">
                      Próximo Adversário
                    </Badge>
                  </div>
                </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(jogo.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {jogo.local}
                  </div>

                {currentStatus && (
                  <Badge variant={currentStatus === "confirmado" ? "default" : "destructive"} className="text-sm">
                    {currentStatus === "confirmado" ? "✅ Presença Confirmada" : "❌ Indisponível"}
                  </Badge>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => confirmarPresenca.mutate("confirmado")}
                    disabled={confirmarPresenca.isPending || currentStatus === "confirmado"}
                    variant={currentStatus === "confirmado" ? "outline" : "default"}
                  >
                    {confirmarPresenca.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Confirmar Presença
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => confirmarPresenca.mutate("indisponivel")}
                    disabled={confirmarPresenca.isPending || currentStatus === "indisponivel"}
                  >
                    Não vou
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum jogo agendado no momento.</p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Admin FAB */}
      {isAdmin && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                className="h-12 w-12 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 ring-2 ring-white/20"
              >
                <Plus className="h-6 w-6 text-primary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-white/20 bg-slate-900/90 text-white backdrop-blur-xl mb-2">
              <DropdownMenuLabel className="font-bold flex items-center gap-2">
                <Plus className="h-4 w-4" /> Gestão Rápida
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => navigate(`${teamData?.slug ? `/time/${teamData.slug}` : ""}/agenda?action=new`)}
                className="flex items-center gap-3 p-3 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Novo Jogo</span>
                  <span className="text-[10px] text-slate-400">Agendar partida</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`${teamData?.slug ? `/time/${teamData.slug}` : ""}/financeiro?action=new`)}
                className="flex items-center gap-3 p-3 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Lançar Caixa</span>
                  <span className="text-[10px] text-slate-400">Finanças</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`${teamData?.slug ? `/time/${teamData.slug}` : ""}/avisos?action=new`)}
                className="flex items-center gap-3 p-3 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Novo Aviso</span>
                  <span className="text-[10px] text-slate-400">Publicar mural</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
