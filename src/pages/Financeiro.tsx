import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransacoes, useFinancialSummary } from "@/hooks/useData";
import { MonthlyTransactionGroup } from "@/components/financeiro/MonthlyTransactionGroup";
import { RequireTeam } from "@/components/RequireTeam";
import { RequireProPlan } from "@/components/RequireProPlan";

const PIE_COLORS = ["#22c55e", "#f87171", "#D4A84B", "#60a5fa", "#a78bfa"];

function SummaryCard({ label, value, color, icon: Icon, isLoading }: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <div className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <p className="text-[10px] text-gray-500 uppercase tracking-[2px] font-semibold">{label}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-28 mx-auto bg-white/5" />
      ) : (
        <p className={`text-2xl md:text-3xl font-bold ${color}`}>
          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      )}
    </div>
  );
}

const darkTooltipStyle = {
  contentStyle: {
    backgroundColor: "#0A1628",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e5e7eb",
    fontSize: "12px",
  },
  itemStyle: { color: "#e5e7eb" },
};

function FinanceiroContent() {
  const { data: transacoes, isLoading } = useTransacoes();
  const { data: summary } = useFinancialSummary();

  const monthlyData = transacoes?.reduce((acc, t) => {
    const month = format(new Date(t.data), "MMM/yy", { locale: ptBR });
    if (!acc[month]) acc[month] = { month, entrada: 0, saida: 0 };
    if (t.tipo === "entrada") acc[month].entrada += Number(t.valor);
    else acc[month].saida += Number(t.valor);
    return acc;
  }, {} as Record<string, { month: string; entrada: number; saida: number }>);

  const barChartData = Object.values(monthlyData || {}).slice(-6);

  const categoryData = transacoes
    ?.filter((t) => t.tipo === "saida")
    .reduce((acc, t) => {
      if (!acc[t.categoria]) acc[t.categoria] = 0;
      acc[t.categoria] += Number(t.valor);
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryData || {}).map(([name, value]) => ({ name, value }));

  const balanceData = transacoes
    ?.slice()
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .reduce((acc, t, i) => {
      const prevBalance = i > 0 ? acc[i - 1].saldo : 0;
      const change = t.tipo === "entrada" ? Number(t.valor) : -Number(t.valor);
      acc.push({ data: format(new Date(t.data), "dd/MM"), saldo: prevBalance + change });
      return acc;
    }, [] as { data: string; saldo: number }[]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A1628]">
        <div className="container py-8 px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-2">💰 Financeiro</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard Financeiro</h1>
            <p className="text-gray-500 mt-1">Acompanhe as finanças do time</p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Saldo Atual"
              value={summary?.saldoAtual ?? 0}
              color="text-[#D4A84B]"
              icon={Wallet}
              isLoading={isLoading}
            />
            <SummaryCard
              label="Total Arrecadado"
              value={summary?.totalArrecadado ?? 0}
              color="text-green-400"
              icon={TrendingUp}
              isLoading={isLoading}
            />
            <SummaryCard
              label="Total Gasto"
              value={summary?.totalGasto ?? 0}
              color="text-red-400"
              icon={TrendingDown}
              isLoading={isLoading}
            />
          </div>

          {/* Charts */}
          <div className="mb-8 grid gap-6 lg:grid-cols-5">
            {/* Bar Chart */}
            <div className="lg:col-span-3 bg-[#0F2440] border border-white/[0.06] rounded-xl p-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-[2px] font-semibold mb-4">Entradas vs Saídas por Mês</p>
              {isLoading ? (
                <Skeleton className="h-56 w-full bg-white/5" />
              ) : barChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barChartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={formatCurrency} {...darkTooltipStyle} />
                      <Bar dataKey="entrada" name="Entradas" fill="rgba(34,197,94,0.6)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saida" name="Saídas" fill="rgba(248,113,113,0.6)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green-500/60" /> Entradas</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-400/60" /> Saídas</span>
                  </div>
                </>
              ) : (
                <p className="py-12 text-center text-gray-500 text-sm">Nenhuma transação registrada.</p>
              )}
            </div>

            {/* Pie Chart */}
            <div className="lg:col-span-2 bg-[#0F2440] border border-white/[0.06] rounded-xl p-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-[2px] font-semibold mb-4">Gastos por Categoria</p>
              {isLoading ? (
                <Skeleton className="h-56 w-full bg-white/5" />
              ) : pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} opacity={0.7} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatCurrency} {...darkTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-gray-500 text-sm">Nenhum gasto registrado.</p>
              )}
              {pieChartData.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center text-[10px] text-gray-500">
                  {pieChartData.map((item, i) => (
                    <span key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length], opacity: 0.7 }} />
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Balance Evolution */}
          <div className="mb-8 bg-[#0F2440] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-gray-500 uppercase tracking-[2px] font-semibold mb-4">Evolução do Saldo</p>
            {isLoading ? (
              <Skeleton className="h-56 w-full bg-white/5" />
            ) : balanceData && balanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="data" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={formatCurrency} {...darkTooltipStyle} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#D4A84B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-gray-500 text-sm">Nenhuma transação registrada.</p>
            )}
          </div>

          {/* Transactions grouped by month */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[2px] font-semibold mb-4">Transações por Mês</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : transacoes && transacoes.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  // Group by month/year
                  const groups: Record<string, typeof transacoes> = {};
                  transacoes.forEach((t) => {
                    const d = new Date(t.data);
                    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(t);
                  });
                  // Sort keys descending
                  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
                  return sortedKeys.map((key) => (
                    <MonthlyTransactionGroup key={key} monthKey={key} transacoes={groups[key]} />
                  ));
                })()}
              </div>
            ) : (
              <p className="py-12 text-center text-gray-500 text-sm">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function FinanceiroPage() {
  return (
    <RequireTeam>
      <RequireProPlan featureName="O Dashboard Financeiro">
        <FinanceiroContent />
      </RequireProPlan>
    </RequireTeam>
  );
}
