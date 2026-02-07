import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Calendar, Users, MapPin, Instagram, MessageCircle, Youtube, Facebook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { statusLabels } from "@/lib/types";
import { ScheduleGameCard } from "@/components/ScheduleGameCard";
import { useProximoJogo, useAvisos, useFinancialSummary, useProximaEscalacao, useEscalacaoJogadores, useUltimoResultado } from "@/hooks/useData";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { Trophy, TrendingUp, Bell, ChevronRight } from "lucide-react";
import { categoryLabels } from "@/lib/types";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function NextGameCard() {
  const { data: jogo, isLoading } = useProximoJogo();
  const { team } = useTeamConfig();

  if (isLoading) {
    return (
      <Card className="border-2 border-secondary bg-card">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (!jogo) {
    return (
      <Card className="border-2 border-secondary bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Próximo Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum jogo agendado no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-secondary bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Calendar className="h-5 w-5" />
          Próximo Jogo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xl font-bold sm:text-2xl">{team.nome} vs {jogo.adversario}</span>
            <Badge variant="secondary" className="w-fit">{statusLabels[jogo.status]}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(jogo.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {jogo.local}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

function LineupPreviewCard() {
  const { data: escalacao, isLoading } = useProximaEscalacao();
  const { data: jogadores } = useEscalacaoJogadores(escalacao?.id);
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          Escalação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {escalacao && escalacao.jogo ? (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              {escalacao.jogo.adversario} - {format(new Date(escalacao.jogo.data_hora), "dd/MM/yyyy")}
            </p>
            <p className="font-medium">Formação: {escalacao.formacao}</p>
            {jogadores && jogadores.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">{jogadores.length} jogadores escalados</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma escalação publicada.</p>
        )}
        <Link to={`${basePath}/escalacao`} className="mt-4 block">
          <Button variant="outline" className="w-full">
            Ver escalação
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function TeamPublicPage() {
  const { team, basePath } = useTeamSlug();
  const { user, profile } = useAuth();
  const isMember = !!profile?.team_id && profile.team_id === team.id;
  const { hasFinanceiro, hasAvisos } = usePlanAccess(team.id);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
        {team.banner_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${team.banner_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/20" />
        <div className="container relative z-10 flex min-h-[500px] md:min-h-[600px] items-center justify-center px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              {team.nome}
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-white/80">
              {isMember
                ? "Gerencie seu time de futebol. Agenda, escalações, resultados, finanças e muito mais em um só lugar."
                : "Bem-vindo à página do time. Faça login para acessar todas as funcionalidades."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {isMember ? (
                <Link to={`${basePath}/agenda`}>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Calendar className="h-5 w-5" />
                    Ver Agenda
                  </Button>
                </Link>
              ) : !user ? (
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Entrar
                  </Button>
                </Link>
              ) : null}
              {team.redes_sociais?.instagram && (
                <a href={team.redes_sociais.instagram} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Instagram className="h-5 w-5" />
                    Instagram
                  </Button>
                </a>
              )}
              {team.redes_sociais?.whatsapp && (
                <a href={team.redes_sociais.whatsapp.startsWith('http') ? team.redes_sociais.whatsapp : `https://${team.redes_sociais.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 bg-green-600 text-white hover:bg-green-700">
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </Button>
                </a>
              )}
              {team.redes_sociais?.youtube && (
                <a href={team.redes_sociais.youtube} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Youtube className="h-5 w-5" />
                    YouTube
                  </Button>
                </a>
              )}
              {team.redes_sociais?.facebook && (
                <a href={team.redes_sociais.facebook} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Facebook className="h-5 w-5" />
                    Facebook
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Agendamento - visível para todos */}
      <section className="py-8 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-6">
          <ScheduleGameCard teamId={team.id} />
        </div>
      </section>

      {isMember && (
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <NextGameCard />
              <LastResultCard />
              {hasFinanceiro && <FinancialCard />}
              {hasAvisos && <NoticesCard />}
              <LineupPreviewCard />
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
