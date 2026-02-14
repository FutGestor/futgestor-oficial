import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, MapPin, Calendar, TrendingUp, TrendingDown, Minus, Shield, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useResultados } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Link } from "react-router-dom";

function getResultType(golsFavor: number, golsContra: number) {
  if (golsFavor > golsContra) return "vitoria";
  if (golsFavor < golsContra) return "derrota";
  return "empate";
}

function ResultIcon({ tipo }: { tipo: "vitoria" | "derrota" | "empate" }) {
  if (tipo === "vitoria") return <TrendingUp className="h-5 w-5 text-green-600" />;
  if (tipo === "derrota") return <TrendingDown className="h-5 w-5 text-destructive" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
}

function ResultadosContent() {
  const { team } = useTeamSlug();
  const { data: resultados, isLoading } = useResultados(team.id);

  // Estatísticas
  const stats = resultados?.reduce(
    (acc, r) => {
      const tipo = getResultType(r.gols_favor, r.gols_contra);
      acc.total++;
      if (tipo === "vitoria") acc.vitorias++;
      else if (tipo === "derrota") acc.derrotas++;
      else acc.empates++;
      acc.golsPro += r.gols_favor;
      acc.golsContra += r.gols_contra;
      return acc;
    },
    { total: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 }
  );

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Resultados</h1>
          <p className="text-muted-foreground">Histórico de partidas do {team.nome}</p>
        </div>

        {/* Estatísticas */}
        {!isLoading && stats && stats.total > 0 && (
          <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6 text-center p-4">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Jogos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center p-4">
                <p className="text-2xl font-bold text-green-600">{stats.vitorias}</p>
                <p className="text-xs text-muted-foreground">Vitórias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center p-4">
                <p className="text-2xl font-bold text-muted-foreground">{stats.empates}</p>
                <p className="text-xs text-muted-foreground">Empates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center p-4">
                <p className="text-2xl font-bold text-destructive">{stats.derrotas}</p>
                <p className="text-xs text-muted-foreground">Derrotas</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="pt-6 text-center p-4">
                <p className="text-2xl font-bold text-foreground">
                  {stats.golsPro}:{stats.golsContra}
                </p>
                <p className="text-xs text-muted-foreground">Gols (P:C)</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de resultados */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Histórico de Partidas</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : resultados && resultados.length > 0 ? (
            <div className="grid gap-6">
              {resultados.map((resultado) => {
                const tipo = getResultType(resultado.gols_favor, resultado.gols_contra);
                const adversarioInfo = resultado.jogo?.time_adversario;
                
                // Process goalscorers
                const goleadores = resultado.estatisticas_partida
                  ?.filter(stat => stat.gols > 0)
                  .map(stat => ({
                    nome: stat.jogador?.apelido || stat.jogador?.nome || "Jogador",
                    gols: stat.gols
                  }));

                return (
                  <Card key={resultado.id} className="overflow-hidden border-muted">
                    {/* Header com Status */}
                    <div className={cn(
                      "px-4 py-1.5 text-xs font-bold text-center uppercase tracking-wider text-white",
                      tipo === "vitoria" && "bg-green-600",
                      tipo === "derrota" && "bg-red-600",
                      tipo === "empate" && "bg-gray-500"
                    )}>
                      {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : "Empate"}
                    </div>

                    <CardContent className="p-0">
                      <div className="p-6">
                        {/* Placar Confronto */}
                        <div className="flex items-center justify-between mb-6">
                          {/* Meu Time */}
                          <div className="flex flex-col items-center gap-2 w-1/3">
                             <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                              {team.escudo_url ? (
                                <img 
                                  src={team.escudo_url} 
                                  alt={team.nome} 
                                  className="h-full w-full object-contain drop-shadow-md"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Shield className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-center line-clamp-2 leading-tight">
                              {team.nome}
                            </span>
                          </div>

                          {/* Placar */}
                          <div className="flex flex-col items-center justify-center w-1/3">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <span className={cn(
                                "text-4xl sm:text-5xl font-black tabular-nums tracking-tighter",
                                tipo === "vitoria" ? "text-green-600" : 
                                tipo === "derrota" ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {resultado.gols_favor}
                              </span>
                              <span className="text-xl text-muted-foreground/40 font-light">x</span>
                              <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-muted-foreground">
                                {resultado.gols_contra}
                              </span>
                            </div>
                          </div>

                          {/* Adversário */}
                          <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                              {adversarioInfo?.escudo_url ? (
                                <img 
                                  src={adversarioInfo.escudo_url} 
                                  alt={adversarioInfo.nome} 
                                  className="h-full w-full object-contain drop-shadow-md"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground">
                                  <Shield className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-center line-clamp-2 leading-tight text-muted-foreground">
                              {adversarioInfo?.nome || resultado.jogo?.adversario || "Adversário"}
                            </span>
                          </div>
                        </div>

                        {/* Local e Data */}
                        <div className="flex flex-col items-center gap-2 pb-4 border-b border-dashed">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                            <MapPin className="h-4 w-4 text-primary" />
                            {resultado.jogo?.local || "Local não informado"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {resultado.jogo?.data_hora &&
                              format(new Date(resultado.jogo.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>

                        {/* Resenha / Artilheiros */}
                        {goleadores && goleadores.length > 0 && (
                          <div className="mt-4 bg-muted/30 rounded-lg p-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5" />
                              Artilheiros do Jogo
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {goleadores.map((g, idx) => (
                                <Badge key={idx} variant="secondary" className="px-2 py-0.5 h-6 text-xs font-medium">
                                  {g.nome} {g.gols > 1 && `(${g.gols})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Observações */}
                        {resultado.observacoes && (
                          <p className="mt-3 text-sm text-muted-foreground italic text-center">
                            "{resultado.observacoes}"
                          </p>
                        )}
                      </div>

                      {/* Botão de Ação */}
                     {/* Action Button */}
      {/* Use team.slug if available, otherwise just relative path IF we were under the same parent, 
          but Resultados is under /time/:slug/resultados, so relative path 'jogo/:id' would be /time/:slug/resultados/jogo/:id (wrong).
          We want /time/:slug/jogo/:id. 
      */}
      <Link 
        to={`/time/${team.slug}/jogo/${resultado.jogo_id}`} 
        className="flex items-center justify-center gap-2 w-full bg-muted/50 hover:bg-muted p-3 text-sm font-medium transition-colors border-t"
      >
        Ver Súmula e Detalhes
        <ChevronRight className="h-4 w-4" />
      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
              <Trophy className="mx-auto mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg font-medium">Nenhum resultado registrado</p>
              <p className="text-sm opacity-60">Os jogos finalizados aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function ResultadosPage() {
  return <ResultadosContent />;
}
