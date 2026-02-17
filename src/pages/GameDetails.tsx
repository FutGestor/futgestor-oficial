import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  Shield, 
  TrendingUp, 
  User,
  AlertTriangle
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useJogo, useEscalacaoByJogoId, useEscalacaoJogadores } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { SocietyField } from "@/components/SocietyField";
import { TeamShield } from "@/components/TeamShield";
import { positionLabels, type GameModality } from "@/lib/types";

function getResultType(golsFavor: number, golsContra: number) {
  if (golsFavor > golsContra) return "vitoria";
  if (golsFavor < golsContra) return "derrota";
  return "empate";
}

export default function GameDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: jogo, isLoading: isLoadingJogo, error } = useJogo(id);
  const teamContext = useOptionalTeamSlug();
  const team = teamContext?.team;

  // New hooks for Lineup
  const { data: escalacao, isLoading: isLoadingEscalacao } = useEscalacaoByJogoId(id);
  const { data: jogadores, isLoading: isLoadingJogadores } = useEscalacaoJogadores(escalacao?.id);

  const isLoading = isLoadingJogo; // Initial loading only for game details

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 px-4 md:px-6">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (error || !jogo) {
    return (
      <Layout>
        <div className="container py-16 px-4 md:px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Jogo não encontrado</h1>
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const resultado = jogo.resultado;
  const tipo = resultado ? getResultType(resultado.gols_favor, resultado.gols_contra) : null;
  const adversarioInfo = jogo.time_adversario;

  // Process goalscorers
  const goleadores = resultado?.estatisticas_partida
    ?.filter(stat => stat.gols > 0)
    .sort((a, b) => b.gols - a.gols);

  const assistentes = resultado?.estatisticas_partida
    ?.filter(stat => stat.assistencias > 0)
    .sort((a, b) => b.assistencias - a.assistencias);

  const backLink = team ? `/time/${team.slug}/resultados` : "/";

  return (
    <Layout>
      <div className="container py-6 px-4 md:px-6 pb-20">
        <Button asChild variant="ghost" className="mb-4 pl-0 hover:bg-transparent -ml-2">
          <Link to={backLink} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </Link>
        </Button>

        {/* Hero Card - Confrontation */}
        <Card className="overflow-hidden border-none shadow-lg mb-6 bg-gradient-to-br from-background to-muted/20">
          <div className={cn(
            "h-2 w-full",
            tipo === "vitoria" && "bg-green-600",
            tipo === "derrota" && "bg-destructive",
            tipo === "empate" && "bg-muted-foreground",
            !tipo && "bg-primary"
          )} />
          
          <CardContent className="p-0">
            <div className="p-6 md:p-10">
              {/* Status Badge */}
              <div className="flex justify-center mb-6">
                <Badge variant={tipo === "vitoria" ? "default" : tipo === "derrota" ? "destructive" : "secondary"} className="uppercase tracking-widest text-xs px-3 py-1">
                  {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : tipo === "empate" ? "Empate" : jogo.status}
                </Badge>
              </div>

              {/* Placar Confronto */}
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {/* Meu Time */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                  <TeamShield 
                    escudoUrl={team?.escudo_url || null} 
                    teamName={team?.nome || "Meu Time"} 
                    size="xl" 
                  />
                  <span className="text-sm md:text-base font-bold text-center leading-tight">
                    {team?.nome || "Meu Time"}
                  </span>
                </div>

                {/* Placar Center */}
                <div className="flex flex-col items-center justify-center w-1/3 shrink-0">
                  <div className="flex items-center gap-3 md:gap-6">
                    <span className={cn(
                      "text-5xl md:text-7xl font-black tabular-nums tracking-tighter",
                      tipo === "vitoria" ? "text-green-600" : 
                      tipo === "derrota" ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {resultado ? resultado.gols_favor : 0}
                    </span>
                    <span className="text-2xl text-muted-foreground/30 font-light">x</span>
                    <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-muted-foreground">
                      {resultado ? resultado.gols_contra : 0}
                    </span>
                  </div>
                  {/* Tempo de jogo se estivesse rolando, ou 'Final' */}
                  <span className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {jogo.status === 'finalizado' ? 'Final de Jogo' : 'Em Breve'}
                  </span>
                </div>

                {/* Adversário */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                  <TeamShield 
                    escudoUrl={adversarioInfo?.escudo_url || null} 
                    teamName={adversarioInfo?.nome || jogo.adversario} 
                    size="xl" 
                  />
                  <span className="text-sm md:text-base font-bold text-center leading-tight text-muted-foreground">
                    {adversarioInfo?.nome || jogo.adversario}
                  </span>
                </div>
              </div>
            </div>

            {/* Infobar */}
            <div className="bg-muted/30 border-t border-dashed p-4 flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {format(new Date(jogo.data_hora), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {format(new Date(jogo.data_hora), "HH:mm", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {jogo.local}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Details */}
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="resumo">Resumo & Súmula</TabsTrigger>
            <TabsTrigger value="escalacao">Escalação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-6">
            {/* Gols e Assistências */}
            {resultado ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Gols
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {goleadores && goleadores.length > 0 ? (
                      <ul className="space-y-3">
                        {goleadores.map((stat, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {stat.gols}
                              </div>
                              <span className="font-medium">{stat.jogador?.apelido || stat.jogador?.nome || "Jogador"}</span>
                            </div>
                            {i === 0 && <Badge variant="secondary" className="text-[10px]">MVP</Badge>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum gol registrado para seu time.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Assistências
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assistentes && assistentes.length > 0 ? (
                      <ul className="space-y-3">
                        {assistentes.map((stat, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {stat.assistencias}
                              </div>
                              <span className="font-medium">{stat.jogador?.apelido || stat.jogador?.nome || "Jogador"}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma assistência registrada.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                   <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                   <p>A súmula ainda não foi preenchida para este jogo.</p>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {resultado?.observacoes && (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm">Observações da Partida</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground italic">"{resultado.observacoes}"</p>
                 </CardContent>
               </Card>
            )}
          </TabsContent>

          <TabsContent value="escalacao" className="space-y-6">
            {isLoadingEscalacao || isLoadingJogadores ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : escalacao ? (
              <div className="grid gap-6 lg:grid-cols-3">
                 {/* Soccer Field */}
                 <div className="lg:col-span-2">
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <img src="/field-icon.svg" className="h-4 w-4 hidden" alt="" /> {/* Just in case we need an icon */}
                         Campinho
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <SocietyField
                         modalidade={((escalacao as any)?.modalidade as GameModality) || 'society-6'}
                         formacao={escalacao.formacao || '2-2-2'}
                         jogadores={
                           jogadores?.filter(ej => ej.posicao_campo !== 'banco').map((ej) => ({
                             jogador: ej.jogador!,
                             posicao_campo: ej.posicao_campo,
                           })) || []
                         }
                       />
                     </CardContent>
                   </Card>
                 </div>

                 {/* Bench & List */}
                 <div className="space-y-6">
                    {/* Banco de Reservas */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                          Banco de Reservas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {jogadores && jogadores.filter(j => j.posicao_campo === 'banco').length > 0 ? (
                           <div className="flex flex-wrap gap-2">
                             {jogadores.filter(ej => ej.posicao_campo === 'banco').map((ej) => (
                               <div
                                 key={ej.id}
                                 className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 border"
                               >
                                 <div className="h-6 w-6 rounded-full bg-transparent flex items-center justify-center text-[10px] font-bold border">
                                    {ej.jogador?.numero || "-"}
                                 </div>
                                 <span className="text-xs font-medium">
                                   {ej.jogador?.apelido || ej.jogador?.nome}
                                 </span>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Nenhum jogador no banco.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Lista Titulares (Optional, but good for mobile backup if field is small) */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                          Titulares
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="space-y-2">
                           {jogadores?.filter(ej => ej.posicao_campo !== 'banco').map((ej) => (
                             <div key={ej.id} className="flex items-center justify-between text-sm">
                               <div className="flex items-center gap-2">
                                  <span className="font-bold w-5 text-center text-muted-foreground">{ej.jogador?.numero}</span>
                                  <span>{ej.jogador?.apelido || ej.jogador?.nome}</span>
                               </div>
                               <Badge variant="outline" className="text-[10px] h-5">{positionLabels[ej.jogador?.posicao || 'mei']}</Badge>
                             </div>
                           ))}
                         </div>
                      </CardContent>
                    </Card>
                 </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                   <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-6 w-6 opacity-20" />
                   </div>
                   <p>A escalação para este jogo ainda não foi definida.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
