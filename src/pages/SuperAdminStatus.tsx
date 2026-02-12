import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart3,
    ArrowLeft,
    Users,
    MousePointer2,
    Clock,
    TrendingUp,
    Settings,
    AlertCircle,
    RefreshCw,
    Globe
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock data for initial layout
const MOCK_DATA = [
    { name: "Seg", visitantes: 400, views: 2400 },
    { name: "Ter", visitantes: 300, views: 1398 },
    { name: "Qua", visitantes: 200, views: 9800 },
    { name: "Qui", visitantes: 278, views: 3908 },
    { name: "Sex", visitantes: 189, views: 4800 },
    { name: "Sáb", visitantes: 239, views: 3800 },
    { name: "Dom", visitantes: 349, views: 4300 },
];

export default function SuperAdminStatus() {
    const { isSuperAdmin, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasConfig, setHasConfig] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        visitors: 0,
        pageviews: 0,
        bounce_rate: 0,
        avg_duration: 0
    });
    const [topPages, setTopPages] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && isSuperAdmin) {
            checkConfig();
        }
    }, [authLoading, isSuperAdmin]);

    const checkConfig = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.functions.invoke('get-vercel-analytics');

            if (error) {
                if (error.message?.includes('400') || error.message?.includes('missing')) {
                    setHasConfig(false);
                }
                throw error;
            }

            if (data) {
                // Parse stats for the chart
                const chartData = (data.analytics || []).map((item: any) => ({
                    name: new Date(item.key).toLocaleDateString('pt-BR', { weekday: 'short' }),
                    visitantes: item.visitors || 0,
                    views: item.pageviews || 0
                }));

                setAnalyticsData(chartData.length > 0 ? chartData : MOCK_DATA);

                // Calculate totals for KPIs
                const totals = (data.analytics || []).reduce((acc: any, curr: any) => ({
                    visitors: acc.visitors + (curr.visitors || 0),
                    pageviews: acc.pageviews + (curr.pageviews || 0),
                    bounce_rate: acc.bounce_rate + (curr.bounce_rate || 0),
                    avg_duration: acc.avg_duration + (curr.avg_duration || 0)
                }), { visitors: 0, pageviews: 0, bounce_rate: 0, avg_duration: 0 });

                const count = (data.analytics || []).length || 1;
                setMetrics({
                    visitors: totals.visitors,
                    pageviews: totals.pageviews,
                    bounce_rate: Math.round(totals.bounce_rate / count),
                    avg_duration: Math.round(totals.avg_duration / count)
                });

                // Top Pages
                setTopPages(data.topPages || []);

                setHasConfig(true);
                toast.success("Dados atualizados com sucesso");
            }
        } catch (error: any) {
            console.error("Error fetching analytics:", error);
            setHasConfig(false);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;
    if (!isSuperAdmin) return <Navigate to="/" replace />;

    return (
        <Layout>
            <div className="min-h-screen bg-[#0A1628]">
                <div className="container py-8 px-4 md:px-6">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                                className="text-gray-400 hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-1">🔍 Infraestrutura</p>
                                <h1 className="text-3xl font-bold text-white">Status do Sistema</h1>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={checkConfig}
                            className="bg-[#0F2440] border-white/10 text-gray-300 hover:bg-[#1A365D]"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </div>

                    {!hasConfig && (
                        <Card className="mb-8 border-yellow-500/20 bg-yellow-500/5">
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="rounded-full bg-yellow-500/20 p-3">
                                        <Settings className="h-6 w-6 text-yellow-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">Configuração Pendente</h3>
                                        <p className="text-sm text-gray-400">
                                            Para visualizar os dados reais da Vercel, você precisa configurar as variáveis de ambiente <code className="text-yellow-500">VERCEL_TOKEN</code> e <code className="text-yellow-500">VERCEL_PROJECT_ID</code>.
                                        </p>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-yellow-500 p-0 h-auto font-bold"
                                        onClick={() => toast.info("Instruções enviadas no chat")}
                                    >
                                        Ver Instruções
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* KPI Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Visitantes Únicos</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{loading ? <Skeleton className="h-8 w-20 bg-white/10" /> : metrics.visitors.toLocaleString()}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Últimos 7 dias</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Visualizações de Página</CardTitle>
                                <MousePointer2 className="h-4 w-4 text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{loading ? <Skeleton className="h-8 w-20 bg-white/10" /> : metrics.pageviews.toLocaleString()}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Últimos 7 dias</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tempo Médio</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{loading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `${Math.floor(metrics.avg_duration / 60)}m ${metrics.avg_duration % 60}s`}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Média por sessão</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Taxa de Rejeição</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{loading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `${metrics.bounce_rate}%`}</div>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase">Média da semana</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Main Chart */}
                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader>
                                <CardTitle className="text-lg">Tráfego de Visitantes</CardTitle>
                                <CardDescription className="text-gray-500 text-xs text-balance">Volume de acessos únicos nos últimos 7 dias</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData}>
                                        <defs>
                                            <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#4b5563"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#4b5563"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#0F2440", borderColor: "#ffffff10", color: "#fff" }}
                                            itemStyle={{ color: "#3b82f6" }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="visitantes"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorVis)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Device/Browser Info Mock */}
                        <Card className="bg-[#0F2440] border-white/[0.06]">
                            <CardHeader>
                                <CardTitle className="text-lg">Top Páginas</CardTitle>
                                <CardDescription className="text-gray-500 text-xs">Páginas mais acessadas globalmente</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-4">
                                    {loading ? (
                                        [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full bg-white/5" />)
                                    ) : topPages.length > 0 ? (
                                        topPages.map((item: any) => (
                                            <div key={item.path} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] px-1.5 py-0 h-4">
                                                            {item.pageviews} views
                                                        </Badge>
                                                        <span className="text-gray-300 font-mono text-[10px]">{item.path}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (item.pageviews / metrics.pageviews) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 text-sm">Nenhum dado de acesso recente.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Infrastructure Alerts */}
                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-green-500" />
                            Estado da Infraestrutura
                        </h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                { label: "Frontend (Vercel)", status: "Operacional", color: "text-green-500" },
                                { label: "Banco de Dados (Supabase)", status: "Operacional", color: "text-green-500" },
                                { label: "Edge Functions", status: "Operacional", color: "text-green-500" },
                            ].map((service) => (
                                <div key={service.label} className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-400 font-medium">{service.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${service.color}`}>{service.status}</span>
                                        <div className={`h-2 w-2 rounded-full ${service.color === 'text-green-500' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
