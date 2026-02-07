import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Trophy, Bell, ClipboardList, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogos, useJogadores, useFinancialSummary, useResultados, useAvisos } from "@/hooks/useData";
import { useTeamConfig } from "@/hooks/useTeamConfig";

export default function AdminDashboard() {
  const { data: jogos, isLoading: loadingJogos } = useJogos();
  const { data: jogadores, isLoading: loadingJogadores } = useJogadores(false);
  const { data: summary, isLoading: loadingSummary } = useFinancialSummary();
  const { data: resultados, isLoading: loadingResultados } = useResultados();
  const { data: avisos, isLoading: loadingAvisos } = useAvisos();
  const { team } = useTeamConfig();

  const proximosJogos = jogos?.filter(j => new Date(j.data_hora) >= new Date()).length || 0;
  const jogosFinalizados = resultados?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do {team.nome}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Atual
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${(summary?.saldoAtual ?? 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                R$ {(summary?.saldoAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jogadores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingJogadores ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {jogadores?.filter(j => j.ativo).length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximos Jogos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingJogos ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{proximosJogos}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jogos Finalizados
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingResultados ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{jogosFinalizados}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/jogos">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Gerenciar Jogos</h3>
                <p className="text-sm text-muted-foreground">Adicionar e editar partidas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/jogadores">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Gerenciar Jogadores</h3>
                <p className="text-sm text-muted-foreground">Cadastrar e editar elenco</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/transacoes">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Gerenciar Finanças</h3>
                <p className="text-sm text-muted-foreground">Registrar transações</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/resultados">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Registrar Resultados</h3>
                <p className="text-sm text-muted-foreground">Placares das partidas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/escalacoes">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Montar Escalações</h3>
                <p className="text-sm text-muted-foreground">Definir time para jogos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/avisos">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Publicar Avisos</h3>
                <p className="text-sm text-muted-foreground">Comunicados para o time</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
