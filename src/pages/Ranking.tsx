import { Trophy, Target, Users, Star } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRanking, useRankingDestaques } from "@/hooks/useEstatisticas";
import { cn } from "@/lib/utils";

function PodiumItem({
  position,
  nome,
  foto,
  valor,
  label
}: {
  position: 1 | 2 | 3;
  nome: string;
  foto: string | null;
  valor: number;
  label: string;
}) {
  const heights = { 1: "h-24", 2: "h-16", 3: "h-12" };
  const colors = {
    1: "bg-yellow-500",
    2: "bg-gray-400",
    3: "bg-amber-700"
  };
  const orders = { 1: "order-2", 2: "order-1", 3: "order-3" };

  return (
    <div className={cn("flex flex-col items-center", orders[position])}>
      <div className="relative z-10 p-4 md:p-8">
        {foto ? (
          <img
            src={foto}
            alt={nome}
            className="h-16 w-16 rounded-full border-4 border-white/10 object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/10 bg-primary/10 text-xl font-bold shadow-lg">
            {nome.charAt(0)}
          </div>
        )}
        <div className={cn(
          "absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold text-white",
          colors[position]
        )}>
          {position}
        </div>
      </div>
      <span className="text-sm font-medium">{nome}</span>
      <span className="text-xs text-muted-foreground">{valor} {label}</span>
      <div className={cn("mt-2 w-20 rounded-t", colors[position], heights[position])} />
    </div>
  );
}

interface RankingItem {
  jogador: {
    id: string;
    nome: string;
    apelido: string | null;
    foto_url: string | null;
  };
  gols?: number;
  assistencias?: number;
  jogos?: number;
  votos?: number;
}

function RankingTable({
  data,
  valorKey,
  label,
  icon: Icon,
}: {
  data: RankingItem[];
  valorKey: "gols" | "assistencias" | "jogos" | "votos";
  label: string;
  icon: React.ElementType;
}) {
  if (data.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/10">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Icon className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>Nenhum dado disponível ainda.</p>
        </CardContent>
      </Card>
    );
  }


  const top3 = data.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Pódio */}
      {top3.length >= 3 && (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-end justify-center gap-4">
              {top3[1] && (
                <PodiumItem
                  position={2}
                  nome={top3[1].jogador.apelido || top3[1].jogador.nome}
                  foto={top3[1].jogador.foto_url}
                  valor={top3[1][valorKey] ?? 0}
                  label={label}
                />
              )}
              {top3[0] && (
                <PodiumItem
                  position={1}
                  nome={top3[0].jogador.apelido || top3[0].jogador.nome}
                  foto={top3[0].jogador.foto_url}
                  valor={top3[0][valorKey] ?? 0}
                  label={label}
                />
              )}
              {top3[2] && (
                <PodiumItem
                  position={3}
                  nome={top3[2].jogador.apelido || top3[2].jogador.nome}
                  foto={top3[2].jogador.foto_url}
                  valor={top3[2][valorKey] ?? 0}
                  label={label}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista completa */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Ranking Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={item.jogador.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2",
                  index < 3 && "bg-secondary/30"
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  index === 0 && "bg-yellow-500 text-white",
                  index === 1 && "bg-gray-400 text-white",
                  index === 2 && "bg-amber-700 text-white",
                  index > 2 && "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                {item.jogador.foto_url ? (
                  <img
                    src={item.jogador.foto_url}
                    alt={item.jogador.nome}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    {item.jogador.nome.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.jogador.apelido || item.jogador.nome}</p>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {item[valorKey] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useTeamSlug } from "@/hooks/useTeamSlug";

function RankingContent() {
  const { team } = useTeamSlug();
  const { data: ranking, isLoading } = useRanking(team?.id);
  const { data: destaques, isLoading: isLoadingDestaques } = useRankingDestaques(team?.id);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ranking</h1>
          <p className="text-muted-foreground text-shadow-sm font-medium">Artilharia e estatísticas do time</p>
        </div>

        {isLoading || isLoadingDestaques ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="artilharia" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-black/40 backdrop-blur-xl border border-white/10">
              <TabsTrigger value="artilharia" className="gap-1 text-xs sm:gap-2 sm:text-sm">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Artilharia</span>
                <span className="sm:hidden">Gols</span>
              </TabsTrigger>
              <TabsTrigger value="assistencias" className="gap-1 text-xs sm:gap-2 sm:text-sm">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Assistências</span>
                <span className="sm:hidden">Assist.</span>
              </TabsTrigger>
              <TabsTrigger value="participacao" className="gap-1 text-xs sm:gap-2 sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Participação</span>
                <span className="sm:hidden">Jogos</span>
              </TabsTrigger>
              <TabsTrigger value="destaques" className="gap-1 text-xs sm:gap-2 sm:text-sm">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Destaques</span>
                <span className="sm:hidden">MVP</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="artilharia">
              <RankingTable
                data={ranking?.artilheiros || []}
                valorKey="gols"
                label="gols"
                icon={Trophy}
              />
            </TabsContent>

            <TabsContent value="assistencias">
              <RankingTable
                data={ranking?.assistencias || []}
                valorKey="assistencias"
                label="assist."
                icon={Target}
              />
            </TabsContent>

            <TabsContent value="participacao">
              <RankingTable
                data={ranking?.participacao || []}
                valorKey="jogos"
                label="jogos"
                icon={Users}
              />
            </TabsContent>

            <TabsContent value="destaques">
              <RankingTable
                data={destaques || []}
                valorKey="votos"
                label="votos"
                icon={Star}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

export default function RankingPage() {
  return <RankingContent />;
}
