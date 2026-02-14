import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  TrendingUp, 
  Wallet, 
  ChevronLeft,
  DollarSign,
  Target,
  Sword,
  Shield,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialSummary, useResultados } from "@/hooks/useData";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from "recharts";

export default function AdminDashboard() {
  const { team } = useTeamConfig();
  const { data: summary, isLoading: loadingSummary } = useFinancialSummary(team.id);
  const { data: resultados, isLoading: loadingResultados } = useResultados(team.id);
  const { basePath } = useTeamSlug();
  const navigate = useNavigate();

  // Calcular estatísticas da temporada
  const vitorias = resultados?.filter(r => (r.gols_favor ?? 0) > (r.gols_contra ?? 0)).length || 0;
  const empates = resultados?.filter(r => (r.gols_favor ?? 0) === (r.gols_contra ?? 0)).length || 0;
  const derrotas = resultados?.filter(r => (r.gols_favor ?? 0) < (r.gols_contra ?? 0)).length || 0;
  const totalJogos = resultados?.length || 0;
  
  const golsPro = resultados?.reduce((acc, r) => acc + (r.gols_favor ?? 0), 0) || 0;
  const golsContra = resultados?.reduce((acc, r) => acc + (r.gols_contra ?? 0), 0) || 0;
  
  const aproveitamento = totalJogos > 0 
    ? Math.round(((vitorias * 3 + empates) / (totalJogos * 3)) * 100) 
    : 0;

  const chartData = [
    { name: "Vitórias", value: vitorias, color: "#10b981" },
    { name: "Empates", value: empates, color: "#f59e0b" },
    { name: "Derrotas", value: derrotas, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 animate-in fade-in duration-700">
      {/* Header Executivo */}
      <div className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => navigate(basePath || "/")}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xl font-bold tracking-tight">Voltar para o Início</span>
        </Button>
        <div className="text-right">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase text-foreground">
            Painel Executivo
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm">
            {team.nome} • Temporada Atual
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Lado Esquerdo: Gráfico e Resumo */}
        <Card className="lg:col-span-7 bg-card border-border soft-shadow overflow-hidden group">
          <CardContent className="p-8 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">Resumo da Temporada</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{totalJogos} Jogos Realizados</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-5xl md:text-6xl font-black text-primary">{aproveitamento}%</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aproveitamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[280px] w-full relative">
                {totalJogos > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '8px' 
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-border rounded-full">
                    <p className="text-muted-foreground text-xs uppercase font-bold text-center px-8">Sem dados suficientes para o gráfico</p>
                  </div>
                )}
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-6xl font-black text-foreground">{totalJogos}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Partidas</span>
                </div>
              </div>

              <div className="space-y-4">
                <StatLine icon={Sword} label="Vitórias" value={vitorias} color="text-green-500" />
                <StatLine icon={Shield} label="Empates" value={empates} color="text-amber-500" />
                <StatLine icon={Trophy} label="Derrotas" value={derrotas} color="text-red-500" />
                <div className="pt-4 border-t border-border flex justify-between px-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gols Pró</p>
                    <p className="text-3xl font-black text-primary">{golsPro}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gols Contra</p>
                    <p className="text-3xl font-black text-red-500">{golsContra}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Saldo Gols</p>
                    <p className="text-3xl font-black text-foreground">{golsPro - golsContra}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lado Direito: Financeiro e Destaques */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
          
          {/* Card de Saldo Neon */}
          <Card className="flex-1 bg-card border-border soft-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet className="h-32 w-32" />
            </div>
            <CardContent className="p-8 flex flex-col justify-between h-full min-h-[220px]">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Financeiro</h3>
              </div>
              
              <div className="relative z-10">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mb-1">Saldo em Caixa Disponível</p>
                {loadingSummary ? (
                  <Skeleton className="h-16 w-3/4 bg-muted" />
                ) : (
                  <div className={cn(
                    "text-6xl md:text-8xl font-black tracking-tighter transition-all",
                    (summary?.saldoAtual ?? 0) >= 0 ? "text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "text-destructive"
                  )}>
                    R$ {(summary?.saldoAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex items-center gap-2 relative z-10 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium uppercase tracking-wider">Status: Saudável</span>
              </div>
            </CardContent>
          </Card>

          {/* Card de Performance Adicional */}
          <Card className="bg-card border-border soft-shadow group">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <Target className="h-5 w-5 text-primary mb-2" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Gols / Jogo</p>
                  <p className="text-3xl font-black text-foreground">{totalJogos > 0 ? (golsPro / totalJogos).toFixed(1) : "0.0"}</p>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-amber-500/30 transition-colors">
                  <Shield className="h-5 w-5 text-amber-500 mb-2" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Defesa / Jogo</p>
                  <p className="text-3xl font-black text-foreground">{totalJogos > 0 ? (golsContra / totalJogos).toFixed(1) : "0.0"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Informativo no Rodapé */}
      <div className="max-w-7xl mx-auto mt-12 text-center opacity-30">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em]">FutGestor Executivo v2.0 • Data Analytics</p>
      </div>
    </div>
  );
}

function StatLine({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-2xl font-black", color)}>{value}</span>
    </div>
  );
}
