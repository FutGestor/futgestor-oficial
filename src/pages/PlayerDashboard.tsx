import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, MapPin, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePlayerPerformance } from "@/hooks/useEstatisticas";
import { PerformanceCharts } from "@/components/PerformanceCharts";

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

  // Fetch player performance data (new)
  const performance = usePlayerPerformance(jogadorId, teamId);

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
        .select("*")
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

  return { jogador, team, financeiro, proximoJogo, confirmacao, performance, jogadorId, teamId };
}

export default function PlayerDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { jogador, team, financeiro, proximoJogo, confirmacao, performance, jogadorId, teamId } = usePlayerData();

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.jogador_id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card p-4">
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
                  <img src={teamData.escudo_url} alt="" className="h-4 w-4 rounded-full" />
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
      <main className="flex-1 space-y-4 pb-8 p-4">
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

        {/* Card Próximo Jogo */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">⚽ Próximo Jogo</h2>
            {proximoJogo.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : jogo ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold">{jogo.adversario}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(jogo.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {jogo.local}
                  </div>
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
        {/* Evolução e Performance */}
        {performance.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : (
          <PerformanceCharts 
            performanceData={performance.data} 
            jogadorId={jogadorId!} 
          />
        )}
      </main>
    </div>
  );
}
