import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
  Cell
} from "recharts";
import { Layout } from "@/components/layout/Layout";

const ALLOWED_EMAIL = "futgestor@gmail.com";

interface SaasPayment {
  id: string;
  team_id: string | null;
  plano: string;
  valor: number;
  status: string;
  metodo: string | null;
  mp_payment_id: string | null;
  created_at: string;
}

export default function SuperAdminVendas() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [payments, setPayments] = useState<SaasPayment[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [activeCount, setActiveCount] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [mrr, setMrr] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ALLOWED_EMAIL) {
      toast({ variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para acessar esta página." });
      navigate("/", { replace: true });
      return;
    }
    setAuthorized(true);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    // Fetch payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("saas_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }
    const paymentsList = (paymentsData || []) as SaasPayment[];

    // Fetch team names separately
    const teamIds = [...new Set(paymentsList.map(p => p.team_id).filter(Boolean))] as string[];
    const namesMap: Record<string, string> = {};
    if (teamIds.length > 0) {
      // Fetch team names
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, nome")
        .in("id", teamIds);
      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
      }
      if (teamsData) {
        teamsData.forEach(t => { namesMap[t.id] = t.nome; });
      }

      // Fetch profile emails as fallback (owner of each team)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("team_id, nome, id")
        .in("team_id", teamIds);
      if (profilesData) {
        profilesData.forEach(p => {
          if (p.team_id && !namesMap[p.team_id]) {
            namesMap[p.team_id] = p.nome || p.id;
          }
        });
      }
    }

    // Fetch all active subscriptions for MRR calculation
    const { data: subsData, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active");

    if (subsData) {
      setActiveSubscriptions(subsData);
      const calculatedMrr = subsData.reduce((sum, sub) => {
        if (sub.plano === "pro") return sum + 19.90;
        if (sub.plano === "liga") return sum + 39.90;
        if (sub.plano === "basico") return sum + 9.90;
        return sum;
      }, 0);
      setMrr(calculatedMrr);
    }

    // Chart Data Preparation (last 6 months)
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    const monthlyRevenue = months.map(month => {
      const monthStr = format(month, "MMM", { locale: ptBR });
      const monthStart = startOfMonth(month);
      const nextMonthStart = startOfMonth(subMonths(month, -1));

      const revenue = paymentsList
        .filter(p => p.status === "approved" &&
          new Date(p.created_at) >= monthStart &&
          new Date(p.created_at) < nextMonthStart)
        .reduce((sum, p) => sum + Number(p.valor), 0);

      return { name: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), valor: revenue };
    });
    setChartData(monthlyRevenue);

    setPayments(paymentsList);
    setTeamNames(namesMap);
    setActiveCount(subsData?.filter(s => s.plano !== "basico").length || 0);
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = payments
    .filter((p) => p.status === "approved" && p.created_at.slice(0, 10) === today)
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const planLabel = (plano: string) => {
    if (plano === "pro") return "Pro";
    if (plano === "liga") return "Liga";
    if (plano === "basico") return "Básico";
    return plano;
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-primary text-primary-foreground">Aprovado</Badge>;
    if (status === "pending") return <Badge variant="secondary">Pendente</Badge>;
    return <Badge variant="destructive">{status}</Badge>;
  };

  const metodoLabel = (metodo: string | null) => {
    if (metodo === "pix") return "Pix";
    if (metodo === "cartao") return "Cartão";
    if (metodo === "boleto") return "Boleto";
    return metodo || "—";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A1628]">
        <div className="mx-auto max-w-6xl p-4 lg:p-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
              <p className="text-sm text-muted-foreground">Métricas SaaS — FutGestor</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/super-admin")}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel Master
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase">MRR (Recorrência)</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                  <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] px-1 h-3">+12%</Badge> vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Bruto histórico</p>
              </CardContent>
            </Card>

            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Assinantes Pagos</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-[10px] text-gray-500 mt-1">Pro + Liga ativos</p>
              </CardContent>
            </Card>

            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Hoje</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  R$ {todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Receitas em {format(new Date(), "dd/MM")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base font-semibold">Crescimento de Receita (6 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#666"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F2440', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#D4A84B' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="valor" fill="#D4A84B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F2440] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base font-semibold">Distribuição de Planos (Ativos)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around h-[200px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-20 w-8 bg-gray-500/20 rounded-t relative overflow-hidden group">
                      <div
                        className="absolute bottom-0 w-full bg-gray-500 transition-all"
                        style={{ height: `${(activeSubscriptions.filter(s => s.plano === 'basico').length / activeSubscriptions.length) * 100 || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Básico</span>
                    <span className="text-xs text-white font-bold">{activeSubscriptions.filter(s => s.plano === 'basico').length}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-20 w-8 bg-blue-500/20 rounded-t relative overflow-hidden group">
                      <div
                        className="absolute bottom-0 w-full bg-blue-500 transition-all"
                        style={{ height: `${(activeSubscriptions.filter(s => s.plano === 'pro').length / activeSubscriptions.length) * 100 || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase">Pro</span>
                    <span className="text-xs text-white font-bold">{activeSubscriptions.filter(s => s.plano === 'pro').length}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-20 w-8 bg-yellow-500/20 rounded-t relative overflow-hidden group">
                      <div
                        className="absolute bottom-0 w-full bg-yellow-500 transition-all"
                        style={{ height: `${(activeSubscriptions.filter(s => s.plano === 'liga').length / activeSubscriptions.length) * 100 || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-yellow-500 font-bold uppercase">Liga</span>
                    <span className="text-xs text-white font-bold">{activeSubscriptions.filter(s => s.plano === 'liga').length}</span>
                  </div>
                </div>
                <p className="text-[10px] text-center text-gray-500 mt-4 italic">* Baseado em assinaturas com status 'active'</p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="bg-[#0F2440] border-white/10 overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#D4A84B]" />
                Transações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <p className="py-20 text-center text-gray-500">Nenhuma transação registrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] py-4">Data</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Time / Cliente</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Plano</TableHead>
                        <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px]">Valor</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Status</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="whitespace-nowrap text-white text-xs">
                            {format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-gray-300 font-medium">{(p.team_id && teamNames[p.team_id]) || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] py-0 h-5 border-white/10 text-gray-400">{planLabel(p.plano)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-white">
                            R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="text-gray-400 text-xs">{metodoLabel(p.metodo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
