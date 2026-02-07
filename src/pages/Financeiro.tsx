import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransacoes, useFinancialSummary } from "@/hooks/useData";
import { RequireTeam } from "@/components/RequireTeam";
import { RequireProPlan } from "@/components/RequireProPlan";

const COLORS = ["#1B3A5C", "#D4A84B", "#8B2323", "#4A7C59", "#6B5B95"];

function FinanceiroContent() {
  const { data: transacoes, isLoading } = useTransacoes();
  const { data: summary } = useFinancialSummary();

  // Prepare data for charts
  const monthlyData = transacoes?.reduce((acc, t) => {
    const month = format(new Date(t.data), "MMM/yy", { locale: ptBR });
    if (!acc[month]) {
      acc[month] = { month, entrada: 0, saida: 0 };
    }
    if (t.tipo === "entrada") {
      acc[month].entrada += Number(t.valor);
    } else {
      acc[month].saida += Number(t.valor);
    }
    return acc;
  }, {} as Record<string, { month: string; entrada: number; saida: number }>);

  const barChartData = Object.values(monthlyData || {}).slice(-6);

  const categoryData = transacoes
    ?.filter((t) => t.tipo === "saida")
    .reduce((acc, t) => {
      if (!acc[t.categoria]) {
        acc[t.categoria] = 0;
      }
      acc[t.categoria] += Number(t.valor);
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Balance evolution
  const balanceData = transacoes
    ?.slice()
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .reduce((acc, t, i) => {
      const prevBalance = i > 0 ? acc[i - 1].saldo : 0;
      const change = t.tipo === "entrada" ? Number(t.valor) : -Number(t.valor);
      acc.push({
        data: format(new Date(t.data), "dd/MM"),
        saldo: prevBalance + change,
      });
      return acc;
    }, [] as { data: string; saldo: number }[]);

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe as finanças do time</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Atual
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div
                  className={`text-2xl font-bold ${
                    (summary?.saldoAtual ?? 0) >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  R$ {(summary?.saldoAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Arrecadado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  R$ {(summary?.totalArrecadado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gasto
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  R$ {(summary?.totalGasto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Bar Chart - Entradas vs Saídas */}
          <Card>
            <CardHeader>
              <CardTitle>Entradas vs Saídas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Bar dataKey="entrada" name="Entradas" fill="#4A7C59" />
                    <Bar dataKey="saida" name="Saídas" fill="#8B2323" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Nenhuma transação registrada.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Categorias de Gastos */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Nenhum gasto registrado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Line Chart - Evolução do Saldo */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Evolução do Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : balanceData && balanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo"
                      stroke="#1B3A5C"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Nenhuma transação registrada.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transacoes && transacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {format(new Date(t.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{t.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        {t.tipo === "entrada" ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            Entrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive">
                            <ArrowDownRight className="h-4 w-4" />
                            Saída
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          t.tipo === "entrada" ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {t.tipo === "entrada" ? "+" : "-"} R${" "}
                        {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma transação registrada.
              </p>
            )}
          </CardContent>
        </Card>
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
