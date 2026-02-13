import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, MapPin, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useResultados } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { useTeamSlug } from "@/hooks/useTeamSlug";

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
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Jogos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.vitorias}</p>
                <p className="text-sm text-muted-foreground">Vitórias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-muted-foreground">{stats.empates}</p>
                <p className="text-sm text-muted-foreground">Empates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-destructive">{stats.derrotas}</p>
                <p className="text-sm text-muted-foreground">Derrotas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {stats.golsPro} : {stats.golsContra}
                </p>
                <p className="text-sm text-muted-foreground">Saldo de Gols</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Histórico de Partidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : resultados && resultados.length > 0 ? (
              <div className="space-y-4">
                {resultados.map((resultado) => {
                  const tipo = getResultType(resultado.gols_favor, resultado.gols_contra);

                  return (
                    <div
                      key={resultado.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:gap-4",
                        tipo === "vitoria" && "border-l-4 border-l-green-600",
                        tipo === "derrota" && "border-l-4 border-l-destructive",
                        tipo === "empate" && "border-l-4 border-l-muted-foreground"
                      )}
                    >
                      {/* Mobile: ícone e badge na mesma linha */}
                      <div className="flex items-center justify-between sm:hidden">
                        <ResultIcon tipo={tipo} />
                        <Badge
                          variant={
                            tipo === "vitoria"
                              ? "default"
                              : tipo === "derrota"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : "Empate"}
                        </Badge>
                      </div>

                      {/* Desktop: ícone à esquerda */}
                      <div className="hidden sm:block">
                        <ResultIcon tipo={tipo} />
                      </div>

                      <div className="flex-1">
                        {/* Mobile: layout empilhado */}
                        <div className="flex flex-col gap-1 sm:hidden">
                          <span className="font-semibold">{team.nome}</span>
                          <span
                            className={cn(
                              "w-fit rounded px-2 py-1 text-lg font-bold whitespace-nowrap",
                              tipo === "vitoria" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                              tipo === "derrota" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                              tipo === "empate" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            )}
                          >
                            {resultado.gols_favor} x {resultado.gols_contra}
                          </span>
                          <span className="font-semibold">{resultado.jogo?.adversario}</span>
                        </div>

                        {/* Desktop: layout horizontal */}
                        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                          <span className="font-semibold">{team.nome}</span>
                          <span
                            className={cn(
                              "rounded px-2 py-1 text-lg font-bold whitespace-nowrap",
                              tipo === "vitoria" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                              tipo === "derrota" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                              tipo === "empate" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            )}
                          >
                            {resultado.gols_favor} x {resultado.gols_contra}
                          </span>
                          <span className="font-semibold">{resultado.jogo?.adversario}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {resultado.jogo?.data_hora &&
                              format(new Date(resultado.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          {resultado.jogo?.local && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {resultado.jogo.local}
                            </span>
                          )}
                        </div>

                        {resultado.observacoes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {resultado.observacoes}
                          </p>
                        )}

                      </div>

                      {/* Desktop: badge à direita */}
                      <Badge
                        className="hidden sm:inline-flex"
                        variant={
                          tipo === "vitoria"
                            ? "default"
                            : tipo === "derrota"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : "Empate"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Trophy className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg">Nenhum resultado registrado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function ResultadosPage() {
  return <ResultadosContent />;
}
