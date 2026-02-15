import { format, subMonths, addMonths, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, Shield, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEscalacoes, useEscalacaoJogadores, useProximaEscalacao } from "@/hooks/useData";
import { positionLabels, modalityLabels, type GameModality } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { SocietyField } from "@/components/SocietyField";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function EscalacaoCard({ escalacao, isSelected, onClick }: {
  escalacao: { id: string; jogo: { adversario: string; data_hora: string } | null; formacao: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all bg-black/40 backdrop-blur-xl border-white/10",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {escalacao.jogo ? `vs ${escalacao.jogo.adversario}` : "Jogo não encontrado"}
            </p>
            {escalacao.jogo && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(escalacao.jogo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          <Badge variant="secondary">{escalacao.formacao}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function EscalacaoContent() {
  const { team } = useTeamConfig();
  const { isAdmin } = useAuth();
  const { basePath } = useTeamSlug();
  const navigate = useNavigate();
  const teamId = team.id || undefined;
  const { data: escalacoes, isLoading: loadingEscalacoes } = useEscalacoes(teamId);
  const { data: proximaEscalacao } = useProximaEscalacao(teamId);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  // Gerar opções de meses dinâmicas baseadas nos jogos
  const monthOptions = useMemo(() => {
    if (!escalacoes) return [];
    
    const months = new Set<string>();
    escalacoes.forEach(esc => {
      if (esc.jogo?.data_hora) {
        months.add(format(new Date(esc.jogo.data_hora), "yyyy-MM"));
      }
    });

    return Array.from(months).sort().reverse();
  }, [escalacoes]);

  const filteredEscalacoes = useMemo(() => {
    if (!escalacoes) return [];
    if (filterMonth === "all") return escalacoes;
    
    return escalacoes.filter((esc) => {
      if (!esc.jogo?.data_hora) return false;
      return format(new Date(esc.jogo.data_hora), "yyyy-MM") === filterMonth;
    });
  }, [escalacoes, filterMonth]);

  const currentId = selectedId || proximaEscalacao?.id;
  const { data: jogadores, isLoading: loadingJogadores } = useEscalacaoJogadores(currentId);

  const currentEscalacao = escalacoes?.find((e) => e.id === currentId) || proximaEscalacao;

  return (
    <Layout>
      <div 
        className="container py-8 px-4 md:px-6"
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escalação</h1>
            <p className="text-muted-foreground text-shadow-sm font-medium">Veja a escalação do time para os jogos</p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => navigate(`${basePath}/escalacao/gerenciar`)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar Escalações
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Soccer Field */}
          <div className="lg:col-span-2">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-2">
                {currentEscalacao ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between sm:px-8">
                      {/* Meu Time */}
                      <div className="flex flex-1 flex-col items-center gap-2">
                        {team.escudo_url ? (
                          <img 
                            src={team.escudo_url} 
                            alt={team.nome} 
                            className="h-16 w-16 object-contain md:h-20 md:w-20" 
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                            <Users className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <span className="text-center font-bold leading-tight md:text-lg">
                          {team.nome}
                        </span>
                      </div>

                      {/* VS */}
                      <div className="flex flex-col items-center gap-1 pt-4">
                        <span className="text-3xl font-black text-muted-foreground/30 md:text-5xl">X</span>
                      </div>

                      {/* Adversário */}
                      <div className="flex flex-1 flex-col items-center gap-2">
                        {currentEscalacao.jogo?.time_adversario?.escudo_url ? (
                          <img 
                            src={currentEscalacao.jogo.time_adversario.escudo_url} 
                            alt={currentEscalacao.jogo.time_adversario.nome} 
                            className="h-16 w-16 object-contain md:h-20 md:w-20" 
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/20 border border-white/10 md:h-20 md:w-20">
                            <Shield className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className="text-center font-bold leading-tight md:text-lg">
                          {currentEscalacao.jogo?.time_adversario?.nome || currentEscalacao.jogo?.adversario || "Adversário"}
                        </span>
                      </div>
                    </div>

                    {/* Info Bar */}
                    <div className="flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-4 text-sm text-muted-foreground sm:flex-row sm:gap-6">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-4 w-4" />
                        {currentEscalacao.jogo && format(new Date(currentEscalacao.jogo.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{currentEscalacao.formacao}</Badge>
                        <Badge variant="outline">
                          {modalityLabels[(currentEscalacao as any).modalidade as GameModality] || 'Society 6x6'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Escalação
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {loadingJogadores ? (
                  <Skeleton className="mx-auto aspect-[3/4] w-full max-w-md" />
                ) : (
                <div className="w-full overflow-visible py-4">
                  <SocietyField
                    modalidade={((currentEscalacao as any)?.modalidade as GameModality) || 'society-6'}
                    formacao={currentEscalacao?.formacao || '2-2-2'}
                    jogadores={
                      jogadores?.filter(ej => ej.posicao_campo !== 'banco').map((ej) => ({
                        jogador: ej.jogador!,
                        posicao_campo: ej.posicao_campo,
                      })) || []
                    }
                  />
                </div>
                )}
              </CardContent>
            </Card>

            {/* Banco de Reservas */}
            {jogadores && jogadores.filter(j => j.posicao_campo === 'banco').length > 0 && (
              <Card className="mt-4 bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">🪑 Banco de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {jogadores.filter(ej => ej.posicao_campo === 'banco').map((ej) => (
                      <div
                        key={ej.id}
                        className="flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-4 py-2"
                      >
                        {ej.jogador?.foto_url ? (
                          <img
                            src={ej.jogador.foto_url}
                            alt={ej.jogador.nome}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {ej.jogador?.numero || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {ej.jogador?.apelido || ej.jogador?.nome}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de jogadores escalados (campo) */}
            {jogadores && jogadores.filter(j => j.posicao_campo !== 'banco').length > 0 && (
              <Card className="mt-4 bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Jogadores Titulares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {jogadores.filter(ej => ej.posicao_campo !== 'banco').map((ej) => (
                      <div
                        key={ej.id}
                        className="flex items-center gap-3 rounded-lg border border-white/10 p-2 bg-black/20"
                      >
                        {ej.jogador?.foto_url ? (
                          <img
                            src={ej.jogador.foto_url}
                            alt={ej.jogador.nome}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {ej.jogador?.numero || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {ej.jogador?.apelido || ej.jogador?.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ej.jogador?.posicao && positionLabels[ej.jogador.posicao]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Histórico de escalações */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Escalações
              </h2>
              
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full bg-black/20 border-white/10">
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escalações</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {format(new Date(month + "-02"), "MMMM yyyy", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingEscalacoes ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredEscalacoes.length > 0 ? (
              <div className="space-y-3">
                {filteredEscalacoes.map((esc) => (
                  <EscalacaoCard
                    key={esc.id}
                    escalacao={{
                      id: esc.id,
                      jogo: esc.jogo || null,
                      formacao: esc.formacao
                    }}
                    isSelected={esc.id === currentId}
                    onClick={() => setSelectedId(esc.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="py-12 text-center">
                  <Filter className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhuma escalação encontrada</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {filterMonth === "all" 
                      ? "Ainda não foram publicadas escalações." 
                      : `Não há jogos cadastrados em ${format(new Date(filterMonth + "-02"), "MMMM 'de' yyyy", { locale: ptBR })}.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function EscalacaoPage() {
  return <EscalacaoContent />;
}
