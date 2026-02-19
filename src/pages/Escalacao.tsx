import { format, subMonths, addMonths, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp, User, Trophy } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { TeamShield } from "@/components/TeamShield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEscalacoes, useEscalacaoJogadores, useProximaEscalacao } from "@/hooks/useData";
import { useEstatisticasJogador } from "@/hooks/useEstatisticas";
import { JogadorStats } from "@/components/JogadorStats";
import { positionLabels, modalityLabels, type GameModality, type Jogador } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { SocietyField } from "@/components/SocietyField";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Componente do Card do Jogador (igual da página Jogadores)
function JogadorDialog({ jogador, onClose }: { jogador: Jogador | null; onClose: () => void }) {
  const { data: stats } = useEstatisticasJogador(jogador?.id);

  return (
    <Dialog open={!!jogador} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader className="sr-only">
          <DialogTitle>{jogador?.nome || 'Jogador'}</DialogTitle>
          <DialogDescription>Perfil do jogador com estatísticas e informações</DialogDescription>
        </DialogHeader>
        {jogador && (
          <div className="overflow-hidden bg-black/40 rounded-xl">
            {/* Foto do jogador - igual ao card da página Jogadores */}
            <div className="aspect-square bg-muted relative rounded-t-xl overflow-hidden">
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
              {/* Nome e Número */}
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{jogador.nome}</h3>
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

              {/* Posição */}
              <Badge variant="secondary" className="w-fit bg-white/5 border-white/10 uppercase tracking-widest text-[10px] mb-2">
                {positionLabels[jogador.posicao]}
              </Badge>

              {/* Dados Físicos */}
              {(jogador.pe_preferido || jogador.altura_cm || jogador.peso_kg) && (
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 px-1 uppercase tracking-tight mb-2">
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
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium px-1 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>Membro desde {format(new Date(jogador.data_entrada), "MMM/yyyy", { locale: ptBR })}</span>
                </div>
              )}

              {/* Bio */}
              {jogador.bio && (
                <p className="text-[10px] text-muted-foreground/60 italic px-1 line-clamp-2 mb-3 leading-tight">
                  "{jogador.bio}"
                </p>
              )}

              {/* Estatísticas */}
              <JogadorStats stats={stats} />
            </CardContent>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [bancoOpen, setBancoOpen] = useState(false);
  const [titularesOpen, setTitularesOpen] = useState(false);
  const [selectedJogador, setSelectedJogador] = useState<Jogador | null>(null);

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

  // Se o usuário selecionou uma escalação específica, use ela
  // Senão, use a próxima escalação publicada
  // Se não houver próxima, use a primeira da lista filtrada (mais recente)
  const currentId = selectedId || proximaEscalacao?.id || filteredEscalacoes[0]?.id;
  const { data: jogadores, isLoading: loadingJogadores } = useEscalacaoJogadores(currentId);

  const currentEscalacao = escalacoes?.find((e) => e.id === currentId) || proximaEscalacao || filteredEscalacoes[0];



  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
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

        {/* Seletor de Jogos - Agora no topo */}
        <Card className="mb-6 bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Selecionar Jogo</h2>
              </div>
              
              <Select 
                value={filterMonth} 
                onValueChange={(value) => {
                  setFilterMonth(value);
                  // Reset selectedId when changing month to avoid stale selection
                  setSelectedId(undefined);
                }}
              >
                <SelectTrigger className="w-full sm:w-48 bg-black/20 border-white/10">
                  <SelectValue placeholder="Filtrar por mês" />
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

              <Select 
                value={currentId || ""} 
                onValueChange={(value) => setSelectedId(value)}
              >
                <SelectTrigger className="flex-1 bg-black/20 border-white/10">
                  <SelectValue placeholder="Selecione um jogo" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEscalacoes ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : filteredEscalacoes.length > 0 ? (
                    filteredEscalacoes.map((esc) => (
                      <SelectItem key={esc.id} value={esc.id}>
                        <div className="flex items-center gap-2">
                          <span>vs {esc.jogo?.adversario || "Jogo"}</span>
                          <Badge variant="secondary" className="text-xs">
                            {esc.formacao}
                          </Badge>
                          {esc.jogo?.data_hora && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(esc.jogo.data_hora), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Nenhuma escalação encontrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Soccer Field - Ocupa mais espaço em mobile */}
          <div className="lg:col-span-2 -mx-4 sm:mx-0">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 rounded-none sm:rounded-xl">
              <CardHeader className="pb-2">
                {currentEscalacao ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between sm:px-8">
                      {/* Meu Time */}
                      <div className="flex flex-1 flex-col items-center gap-2">
                        <TeamShield 
                          escudoUrl={team.escudo_url || null} 
                          teamName={team.nome || "Meu Time"} 
                          size="2xl" 
                        />
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
                        <TeamShield 
                          escudoUrl={currentEscalacao.jogo?.time_adversario?.escudo_url || null} 
                          teamName={currentEscalacao.jogo?.time_adversario?.nome || currentEscalacao.jogo?.adversario || "Adversário"} 
                          size="2xl" 
                        />
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
              <CardContent className="px-2 sm:px-6">
                {loadingJogadores ? (
                  <Skeleton className="mx-auto aspect-[3/4] w-full" />
                ) : (
                <div className="w-full overflow-hidden py-2 sm:py-4">
                  <SocietyField
                    modalidade={((currentEscalacao as any)?.modalidade as GameModality) || 'society-6'}
                    formacao={currentEscalacao?.formacao || '2-2-2'}
                    jogadores={
                      jogadores?.filter(ej => ej.posicao_campo !== 'banco').map((ej) => ({
                        jogador: ej.jogador!,
                        posicao_campo: ej.posicao_campo,
                      })) || []
                    }
                    onPlayerClick={(jogador) => setSelectedJogador(jogador)}
                  />
                </div>
                )}
              </CardContent>
            </Card>

            {/* Banco de Reservas - Collapsible */}
            {jogadores && jogadores.filter(j => j.posicao_campo === 'banco').length > 0 && (
              <Collapsible open={bancoOpen} onOpenChange={setBancoOpen} className="mt-4">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🪑 Banco de Reservas
                          <Badge variant="secondary" className="text-xs">
                            {jogadores.filter(j => j.posicao_campo === 'banco').length}
                          </Badge>
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {bancoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
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
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Lista de jogadores escalados (campo) - Collapsible */}
            {jogadores && jogadores.filter(j => j.posicao_campo !== 'banco').length > 0 && (
              <Collapsible open={titularesOpen} onOpenChange={setTitularesOpen} className="mt-4">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Jogadores Titulares
                          <Badge variant="secondary" className="text-xs">
                            {jogadores.filter(j => j.posicao_campo !== 'banco').length}
                          </Badge>
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {titularesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
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
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>

          {/* Sidebar - Estatísticas/Info adicional (opcional) */}
          <div className="space-y-4">
            {currentEscalacao && (
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formação</span>
                    <Badge variant="secondary">{currentEscalacao.formacao}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modalidade</span>
                    <span className="font-medium">
                      {modalityLabels[(currentEscalacao as any).modalidade as GameModality] || 'Society 6x6'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jogadores</span>
                    <span className="font-medium">
                      {jogadores?.filter(j => j.posicao_campo !== 'banco').length || 0} titulares
                      {jogadores?.filter(j => j.posicao_campo === 'banco').length ? 
                        ` + ${jogadores.filter(j => j.posicao_campo === 'banco').length} reservas` : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog com informações do jogador - Card igual da página Jogadores */}
        <JogadorDialog 
          jogador={selectedJogador} 
          onClose={() => setSelectedJogador(null)} 
        />
      </div>
    </Layout>
  );
}

export default function EscalacaoPage() {
  return <EscalacaoContent />;
}
