import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    Heart, 
    AlertTriangle, 
    ArrowLeft, 
    Users, 
    Calendar, 
    Trophy, 
    Landmark,
    TrendingDown,
    TrendingUp,
    Search
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";

interface TeamHealth {
    team_id: string;
    team_nome: string;
    team_slug: string;
    plano: string;
    total_jogadores: number;
    ultima_escalacao: string | null;
    ultimo_resultado: string | null;
    ultima_transacao: string | null;
    health_score: number;
}

export default function SuperAdminHealth() {
    const navigate = useNavigate();
    const { isSuperAdmin } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: metrics, isLoading } = useQuery({
        queryKey: ["super-admin-health-metrics"],
        enabled: !!isSuperAdmin,
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_teams_health_metrics" as any);
            if (error) throw error;
            // O novo RPC retorna o JSON direto (ou nulo se vazio)
            return (data || []) as TeamHealth[];
        }
    });

    const filteredMetrics = useMemo(() => {
        if (!metrics) return [];
        return metrics.filter(m => 
            m.team_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.team_slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [metrics, searchTerm]);

    const stats = useMemo(() => {
        if (!metrics) return { healthy: 0, atRisk: 0, critical: 0 };
        return {
            healthy: metrics.filter(m => m.health_score >= 70).length,
            atRisk: metrics.filter(m => m.health_score < 70 && m.health_score >= 40).length,
            critical: metrics.filter(m => m.health_score < 40).length,
        };
    }, [metrics]);

    const getScoreColor = (score: number) => {
        if (score >= 70) return "bg-green-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return "Excelente";
        if (score >= 40) return "Em Risco";
        return "Crítico";
    };

    if (!isSuperAdmin) return null;

    return (
        <Layout>
            <div className="min-h-screen bg-[#0A1628]">
                <div className="container py-8 px-4 md:px-6">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/super-admin")}
                                className="text-gray-400 hover:text-white border border-white/10"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Button>
                            <div>
                                <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-1">💓 Retenção SaaS</p>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Saúde dos Clubes</h1>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card className="bg-[#0F2440] border-white/10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-12 w-12 text-green-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ativos & Saudáveis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-green-500">{isLoading ? "..." : stats.healthy}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Clubes com alto engajamento</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0F2440] border-white/10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertTriangle className="h-12 w-12 text-yellow-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atenção Necessária</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-yellow-500">{isLoading ? "..." : stats.atRisk}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Baixa atividade (1-2 semanas)</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0F2440] border-white/10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown className="h-12 w-12 text-red-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Risco de Churn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-red-500">{isLoading ? "..." : stats.critical}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Inativos há mais de 15 dias</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-[#0F2440] border-white/10">
                        <CardHeader className="border-b border-white/5 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <CardTitle className="text-white">Relatório de Saúde por Time</CardTitle>
                                    <CardDescription>Métricas baseadas na recência de uso das ferramentas core.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input 
                                        placeholder="Filtrar clube..." 
                                        className="pl-9 bg-black/20 border-white/10 text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Clube</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Atletas</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Última Atividade</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Health Score</TableHead>
                                            <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px]">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-gray-500">Carregando métricas...</TableCell></TableRow>
                                        ) : filteredMetrics.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-gray-500">Nenhum clube encontrado.</TableCell></TableRow>
                                        ) : (
                                            filteredMetrics.map((team) => (
                                                <TableRow key={team.team_id} className="border-white/5 hover:bg-white/[0.02] group/row">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-bold">{team.team_nome}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${
                                                                    team.plano === 'liga' ? 'text-yellow-500 border-yellow-500/20' : 
                                                                    team.plano === 'pro' ? 'text-blue-500 border-blue-500/20' : 
                                                                    'text-gray-400 border-gray-400/20'
                                                                }`}>
                                                                    {team.plano.toUpperCase()}
                                                                </Badge>
                                                                <span className="text-[10px] text-gray-500 tracking-tight">/{team.team_slug}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-gray-300">
                                                            <Users className="h-3 w-3 text-gray-500" />
                                                            <span className="text-xs">{team.total_jogadores}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <Calendar className="h-3 w-3 text-blue-500" />
                                                                <span className="text-gray-400">Escalação:</span>
                                                                <span className="text-gray-200">
                                                                    {team.ultima_escalacao ? formatDistanceToNow(new Date(team.ultima_escalacao), { addSuffix: true, locale: ptBR }) : "Nunca"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <Trophy className="h-3 w-3 text-yellow-500" />
                                                                <span className="text-gray-400">Resultado:</span>
                                                                <span className="text-gray-200">
                                                                    {team.ultimo_resultado ? formatDistanceToNow(new Date(team.ultimo_resultado), { addSuffix: true, locale: ptBR }) : "Nunca"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <Landmark className="h-3 w-3 text-green-500" />
                                                                <span className="text-gray-400">Finanças:</span>
                                                                <span className="text-gray-200">
                                                                    {team.ultima_transacao ? formatDistanceToNow(new Date(team.ultima_transacao), { addSuffix: true, locale: ptBR }) : "Nunca"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-48">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className={`text-[10px] font-bold ${getScoreColor(team.health_score).replace('bg-', 'text-')}`}>
                                                                    {getScoreLabel(team.health_score)}
                                                                </span>
                                                                <span className="text-xs font-mono text-white">{team.health_score}%</span>
                                                            </div>
                                                            <Progress 
                                                                value={team.health_score} 
                                                                className="h-1.5 bg-white/5" 
                                                                indicatorClassName={getScoreColor(team.health_score)} 
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="text-[10px] h-7 bg-white/5 border-white/10 hover:bg-[#D4A84B] hover:text-white transition-all"
                                                            onClick={() => navigate(`/time/${team.team_slug}`)}
                                                        >
                                                            Ver Dashboard
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
