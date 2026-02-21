import React from "react";
import { User } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJogadoresPublicos } from "@/hooks/useData";
import { useEstatisticasJogadores } from "@/hooks/useEstatisticas";
import { JogadorStats } from "@/components/JogadorStats";
import { positionLabels, type JogadorPublico } from "@/lib/types";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Trophy, Users, UserCheck, Settings2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePlayerAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";

function PlayerMiniAchievements({ jogadorId, posicao }: { jogadorId: string; posicao: string }) {
  const { data: achievements, isLoading } = usePlayerAchievements(jogadorId);

  if (isLoading || !achievements) return <div className="h-7" />;

  const tierOrder: Record<string, number> = { diamante: 4, ouro: 3, prata: 2, bronze: 1, unica: 5 };
  
  const filtered = achievements
    .filter(a => {
      const pos = a.achievement.applicable_positions || [];
      return pos.length === 0 || pos.some(p => p.toLowerCase() === posicao.toLowerCase());
    })
    .filter(a => !!a.current_tier)
    .sort((a, b) => (tierOrder[b.current_tier!] || 0) - (tierOrder[a.current_tier!] || 0));

  const display = filtered.slice(0, 4);
  const extra = filtered.length > 4 ? filtered.length - 4 : 0;

  if (filtered.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mb-3">
      {display.map(a => (
        <AchievementBadge 
          key={a.achievement_id}
          slug={a.achievement.slug}
          tier={a.current_tier}
          iconName={a.achievement.icon}
          size="xs"
        />
      ))}
      {extra > 0 && (
        <span className="text-[10px] font-bold text-muted-foreground ml-1">+{extra}</span>
      )}
    </div>
  );
}

function JogadorCard({ 
  jogador, 
  stats, 
  onViewAchievements 
}: { 
  jogador: JogadorPublico; 
  stats: any;
  onViewAchievements: (id: string, nome: string) => void;
}) {
  return (
    <Card className="overflow-hidden transition-all bg-black/40 backdrop-blur-xl border-white/10 group">
      <div style={{ backgroundColor: 'transparent' }} className="aspect-square bg-muted relative">
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
        
        {/* Achievement Overlay Button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2"
            onClick={() => onViewAchievements(jogador.id, jogador.nome)}
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            Ver Conquistas
          </Button>
        </div>
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

        <div className="flex flex-col gap-2 mb-3">
          <Badge variant="secondary" className="w-fit bg-white/5 border-white/10 uppercase tracking-widest text-[10px]">
            {positionLabels[jogador.posicao]}
          </Badge>

          {/* Dados Físicos */}
          {(jogador.pe_preferido || jogador.altura_cm || jogador.peso_kg) && (
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 px-1 uppercase tracking-tight">
              {jogador.pe_preferido && (
                <span className="capitalize">{jogador.pe_preferido}</span>
              )}
              {jogador.pe_preferido && (jogador.altura_cm || jogador.peso_kg) && <span>•</span>}
              {jogador.altura_cm && (
                <span>{(jogador.altura_cm / 100).toFixed(2)} m</span>
              )}
              {jogador.altura_cm && jogador.peso_kg && <span>•</span>}
              {jogador.peso_kg && (
                <span>{jogador.peso_kg}kg</span>
              )}
            </div>
          )}

          {/* Data de Entrada */}
          {jogador.data_entrada && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium px-1">
              <Calendar className="h-3 w-3" />
              <span>Membro desde {format(new Date(jogador.data_entrada), "MMM/yyyy", { locale: ptBR })}</span>
            </div>
          )}

          {/* Bio Truncada */}
          {jogador.bio && (
            <p className="text-[10px] text-muted-foreground/60 italic px-1 line-clamp-2 mt-1 leading-tight">
              "{jogador.bio}"
            </p>
          )}
        </div>

        <PlayerMiniAchievements 
          jogadorId={jogador.id} 
          posicao={jogador.posicao} 
        />

        <JogadorStats stats={stats} />
      </CardContent>
    </Card>
  );
}

export default function JogadoresPage() {
  const { team, basePath } = useTeamSlug();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: jogadores, isLoading } = useJogadoresPublicos(team?.id);
  const { data: estatisticas } = useEstatisticasJogadores();
  const [selectedPlayer, setSelectedPlayer] = React.useState<{ id: string; nome: string } | null>(null);
  const [searchParams] = useSearchParams();

  // Auto-open based on URL search param
  React.useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && jogadores && jogadores.length > 0) {
      const target = jogadores.find(j => j.id === viewId);
      if (target) {
        setSelectedPlayer({ id: target.id, nome: target.nome });
      }
    }
  }, [searchParams, jogadores]);

  const jogadoresPorPosicao = jogadores?.reduce((acc, j) => {
    if (!acc[j.posicao]) acc[j.posicao] = [];
    acc[j.posicao].push(j);
    return acc;
  }, {} as Record<string, JogadorPublico[]>);

  const posicaoOrder = ['goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante'];

  return (
    <Layout>
      <div 
        className="container py-8 px-4 md:px-6"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jogadores</h1>
            <p className="text-muted-foreground text-shadow-sm font-medium">Conheça o elenco do time</p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => navigate(`${basePath}/jogadores/gerenciar`)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar Elenco
            </Button>
          )}
        </div>

        {isAdmin && jogadores && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Elenco</p>
                  <p className="text-2xl font-bold">{jogadores.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Jogadores Ativos</p>
                  <p className="text-2xl font-bold">{jogadores.filter(j => j.ativo).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-black/40 backdrop-blur-xl border-white/10">
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
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    {positionLabels[posicao as keyof typeof positionLabels]}s
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {jogadoresDaPosicao.map((jogador) => (
                      <JogadorCard
                        key={jogador.id}
                        jogador={jogador}
                        stats={estatisticas?.find(e => e.jogador_id === jogador.id)}
                        onViewAchievements={(id, nome) => setSelectedPlayer({ id, nome })}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="py-16 text-center text-muted-foreground">
              <User className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg">Nenhum jogador cadastrado ainda.</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Conquistas de {selectedPlayer?.nome}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Veja o progresso e medalhas desbloqueadas por este jogador.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedPlayer && (
                <AchievementGrid 
                  jogadorId={selectedPlayer.id} 
                  jogadorNome={selectedPlayer.nome}
                  jogadorPosicao={jogadores?.find(j => j.id === selectedPlayer.id)?.posicao}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
