import { User } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogadoresPublicos } from "@/hooks/useData";
import { useEstatisticasJogadores } from "@/hooks/useEstatisticas";
import { JogadorStats } from "@/components/JogadorStats";
import { positionLabels, type JogadorPublico } from "@/lib/types";
import { useTeamSlug } from "@/hooks/useTeamSlug";

function JogadorCard({ jogador, stats }: { jogador: JogadorPublico; stats: any }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-square bg-muted">
        {jogador.foto_url ? (
          <img
            src={jogador.foto_url}
            alt={jogador.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <User className="h-20 w-20 text-primary/40" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{jogador.nome}</h3>
            {jogador.apelido && (
              <p className="text-sm text-muted-foreground">"{jogador.apelido}"</p>
            )}
          </div>
          {jogador.numero && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {jogador.numero}
            </div>
          )}
        </div>
        
        <Badge variant="secondary" className="mb-3">
          {positionLabels[jogador.posicao]}
        </Badge>

        <JogadorStats stats={stats} />
      </CardContent>
    </Card>
  );
}

export default function JogadoresPage() {
  const { team } = useTeamSlug();
  const { data: jogadores, isLoading } = useJogadoresPublicos(team?.id);
  const { data: estatisticas } = useEstatisticasJogadores();

  const jogadoresPorPosicao = jogadores?.reduce((acc, j) => {
    if (!acc[j.posicao]) acc[j.posicao] = [];
    acc[j.posicao].push(j);
    return acc;
  }, {} as Record<string, JogadorPublico[]>);

  const posicaoOrder = ['goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante'];

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Jogadores</h1>
          <p className="text-muted-foreground">Conheça o elenco do time</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jogadores && jogadores.length > 0 ? (
          <div className="space-y-8">
            {posicaoOrder.map((posicao) => {
              const jogadoresDaPosicao = jogadoresPorPosicao?.[posicao];
              if (!jogadoresDaPosicao || jogadoresDaPosicao.length === 0) return null;

              return (
                <section key={posicao}>
                  <h2 className="mb-4 text-xl font-semibold text-primary">
                    {positionLabels[posicao as keyof typeof positionLabels]}s
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {jogadoresDaPosicao.map((jogador) => (
                      <JogadorCard 
                        key={jogador.id} 
                        jogador={jogador} 
                        stats={estatisticas?.[jogador.id]}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <User className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg">Nenhum jogador cadastrado ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
