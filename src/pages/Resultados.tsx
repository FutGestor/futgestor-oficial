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
import { TeamFormStreak } from "@/components/TeamFormStreak";
import { TeamApprovalDonut } from "@/components/TeamApprovalDonut";
import { SeasonSelector } from "@/components/SeasonSelector";
import { TeamShield } from "@/components/TeamShield";
import { MonthSelector } from "@/components/MonthSelector";
import { useState } from "react";

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
  const { data: allResultados, isLoading } = useResultados(team.id);
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("all");

  // Filtrar resultados por temporada e mês
  const resultados = allResultados?.filter(r => {
    const gameDate = new Date(r.jogo?.data_hora || "");
    
    // Filtro de Temporada
    if (season !== "all") {
      if (gameDate.getFullYear().toString() !== season) return false;
    }
    
    // Filtro de Mês
    if (month !== "all") {
      if (gameDate.getMonth().toString() !== month) return false;
    }
    
    return true;
  });

  // Estatísticas
  const stats = resultados?.reduce(
    (acc, r) => {
      const tipo = getResultType(r.gols_favor, r.gols_contra);
      const mando = r.jogo?.mando;
      
      acc.total++;
      if (tipo === "vitoria") {
        acc.vitorias++;
        if (mando === "mandante") acc.vitoriasMandante++;
        if (mando === "visitante") acc.vitoriasVisitante++;
      }
      else if (tipo === "derrota") acc.derrotas++;
      else {
        acc.empates++;
        if (mando === "mandante") acc.empatesMandante++;
        if (mando === "visitante") acc.empatesVisitante++;
      }

      if (mando === "mandante") acc.jogosMandante++;
      if (mando === "visitante") acc.jogosVisitante++;

      acc.golsPro += r.gols_favor;
      acc.golsContra += r.gols_contra;
      return acc;
    },
    { 
      total: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0,
      jogosMandante: 0, vitoriasMandante: 0, empatesMandante: 0,
      jogosVisitante: 0, vitoriasVisitante: 0, empatesVisitante: 0
    }
  );

  const calcAproveitamento = (jogos: number, vits: number, emps: number) => {
    if (jogos === 0) return 0;
    return Math.round(((vits * 3 + emps) / (jogos * 3)) * 100);
  };

  const aproveitamentoMandante = stats ? calcAproveitamento(stats.jogosMandante, stats.vitoriasMandante, stats.empatesMandante) : 0;
  const aproveitamentoVisitante = stats ? calcAproveitamento(stats.jogosVisitante, stats.vitoriasVisitante, stats.empatesVisitante) : 0;

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resultados</h1>
            <p className="text-muted-foreground">Histórico de partidas do {team.nome}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSelector value={month} onChange={setMonth} />
            <SeasonSelector value={season} onChange={setSeason} />
          </div>
        </div>

        {/* Estatísticas */}
        {!isLoading && stats && stats.total > 0 && (
          <>
            <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {/* Grid de Cards Tradicionais */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                  <CardContent className="pt-6 text-center p-4">
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jogos</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                  <CardContent className="pt-6 text-center p-4">
                    <p className="text-2xl font-bold text-green-600">{stats.vitorias}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vitórias</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                  <CardContent className="pt-6 text-center p-4">
                    <p className="text-2xl font-bold text-muted-foreground">{stats.empates}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Empates</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                  <CardContent className="pt-6 text-center p-4">
                    <p className="text-2xl font-bold text-destructive">{stats.derrotas}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Derrotas</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sequência de Forma */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Últimos 5 Jogos</p>
                    <p className="text-xs font-bold text-white italic">Sequência de Forma</p>
                  </div>
                  <TeamFormStreak resultados={resultados || []} />
                </CardContent>
              </Card>
            </div>

            {/* Donut de Aproveitamento */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
               <TeamApprovalDonut 
                 vitorias={stats.vitorias} 
                 empates={stats.empates} 
                 derrotas={stats.derrotas} 
               />
               <div className="mt-4 space-y-1">
                 <p className="text-lg font-black italic tracking-tighter text-white">
                   {stats.golsPro} : {stats.golsContra}
                 </p>
                 <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Saldo de Gols (P:C)</p>
               </div>
            </Card>
          </div>

          {/* Breakdown por Mando */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Mandante: <span className="text-white">{aproveitamentoMandante}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>Visitante: <span className="text-white">{aproveitamentoVisitante}%</span></span>
            </div>
            {stats.jogosMandante + stats.jogosVisitante < stats.total && (
              <div className="text-[10px] text-zinc-600 italic normal-case font-medium">
                * Algumas partidas não possuem mando definido
              </div>
            )}
          </div>
        </>
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
                      "px-4 py-1.5 text-xs font-bold text-center uppercase tracking-wider text-white flex items-center justify-center gap-2",
                      tipo === "vitoria" && "bg-green-600",
                      tipo === "derrota" && "bg-red-600",
                      tipo === "empate" && "bg-gray-500"
                    )}>
                      {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : "Empate"}
                      {resultado.jogo?.tipo_jogo && (
                        <span className="opacity-50 text-[10px]">• {resultado.jogo.tipo_jogo.toUpperCase()}</span>
                      )}
                    </div>

                    <CardContent className="p-0">
                      <div className="p-6">
                        {/* Placar Confronto */}
                        <div className="flex items-center justify-between mb-6">
                          {/* Meu Time */}
                          <div className="flex flex-col items-center gap-2 w-1/3">
                             <TeamShield 
                               escudoUrl={team.escudo_url} 
                               teamName={team.nome} 
                               size="lg" 
                             />
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
                             <TeamShield 
                               escudoUrl={adversarioInfo?.escudo_url || null} 
                               teamName={adversarioInfo?.nome || resultado.jogo?.adversario || "Adversário"} 
                               size="lg" 
                             />
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

                          <div className="flex items-center gap-2 mt-2">
                             {resultado.jogo?.tipo_jogo && (
                               <Badge variant="outline" className={cn(
                                 "text-[10px] uppercase font-black tracking-widest px-2 py-0 h-5 border-white/5",
                                 resultado.jogo.tipo_jogo === 'amistoso' && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                                 resultado.jogo.tipo_jogo === 'campeonato' && "bg-primary/10 text-primary border-primary/20",
                                 resultado.jogo.tipo_jogo === 'copa' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                 resultado.jogo.tipo_jogo === 'torneio' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                 resultado.jogo.tipo_jogo === 'outro' && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                               )}>
                                 {resultado.jogo.tipo_jogo}
                               </Badge>
                             )}
                             {resultado.jogo?.mando && (
                               <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 py-0 h-5 border-white/5 bg-zinc-800/50 text-zinc-400">
                                 {resultado.jogo.mando}
                               </Badge>
                             )}
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
