import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Trophy, Bell, ClipboardList, Wallet, PlusCircle, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogos, useJogadores, useFinancialSummary, useResultados } from "@/hooks/useData";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { usePlanAccess } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export default function AdminDashboard() {
  const { team } = useTeamConfig();
  const { data: jogos, isLoading: loadingJogos } = useJogos(team.id);
  const { data: jogadores, isLoading: loadingJogadores } = useJogadores(false, team.id);
  const { data: summary, isLoading: loadingSummary } = useFinancialSummary(team.id);
  const { data: resultados, isLoading: loadingResultados } = useResultados(team.id);
  const { basePath } = useTeamSlug();
  const { hasSaldoCard } = usePlanAccess();

  const proximosJogos = jogos?.filter(j => new Date(j.data_hora) >= new Date()).length || 0;
  const jogosFinalizados = resultados?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">
          Visão geral: <span className="text-primary">{team.nome}</span>
        </p>
      </div>

      {/* Quick Stats Grid - 2 columns mobile, 4 columns desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {hasSaldoCard && (
          <Card className="border-none bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo</CardTitle>
              <div className="rounded-full bg-green-500/10 p-1.5">
                <Wallet className="h-3.5 w-3.5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingSummary ? <Skeleton className="h-7 w-20" /> : (
                <div className={cn(
                  "text-lg font-black leading-none tracking-tight truncate",
                  (summary?.saldoAtual ?? 0) >= 0 ? "text-green-500" : "text-destructive"
                )}>
                  R$ {(summary?.saldoAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-none bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atletas</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingJogadores ? <Skeleton className="h-7 w-12" /> : (
              <div className="text-lg font-black leading-none tracking-tight">
                {jogadores?.filter(j => j.ativo).length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agenda</CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingJogos ? <Skeleton className="h-7 w-12" /> : (
              <div className="text-lg font-black leading-none tracking-tight">{proximosJogos}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jogados</CardTitle>
            <div className="rounded-full bg-yellow-500/10 p-1.5">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingResultados ? <Skeleton className="h-7 w-12" /> : (
              <div className="text-lg font-black leading-none tracking-tight">{jogosFinalizados}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gestão Rápida Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Gestão Rápida</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton
            to={`${basePath}/admin/jogos?action=new`}
            icon={PlusCircle}
            label="Novo Jogo"
            description="Agendar partida"
            color="border-primary/50 hover:border-primary"
          />
          <QuickActionButton
            to={`${basePath}/admin/transacoes`}
            icon={DollarSign}
            label="Lançar Caixa"
            description="Entradas/Saídas"
            color="border-green-500/50 hover:border-green-500"
          />
          <QuickActionButton
            to={`${basePath}/admin/escalacoes`}
            icon={ClipboardList}
            label="Escalar"
            description="Ver lista"
            color="border-blue-500/50 hover:border-blue-500"
          />
          <QuickActionButton
            to={`${basePath}/admin/avisos`}
            icon={Bell}
            label="Avisar"
            description="Novo mural"
            color="border-purple-500/50 hover:border-purple-500"
          />
        </div>
      </div>

    </div>
  );
}

function QuickActionButton({ to, icon: Icon, label, description, color }: { to: string; icon: LucideIcon; label: string; description: string; color: string }) {
  return (
    <Link to={to} className="group">
      <Card className={cn(
        "relative overflow-hidden border bg-card hover:bg-muted/50 transition-all active:scale-95",
        color
      )}>
        <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="rounded-xl bg-background/50 p-3 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs md:text-sm font-bold tracking-tight">{label}</p>
            <p className="hidden md:block text-[10px] text-muted-foreground font-medium">{description}</p>
          </div>
          <ArrowUpRight className="absolute top-2 right-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </Link>
  );
}
