import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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
  teams?: { nome: string } | null;
}

export default function SuperAdminVendas() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [payments, setPayments] = useState<SaasPayment[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ALLOWED_EMAIL) {
      toast({ variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para acessar esta página." });
      navigate("/", { replace: true });
      return;
    }
    setAuthorized(true);
    await Promise.all([fetchPayments(), fetchActiveCount()]);
    setLoading(false);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("saas_payments")
      .select("*, teams(nome)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching payments:", error);
      return;
    }
    setPayments((data as unknown as SaasPayment[]) || []);
  };

  const fetchActiveCount = async () => {
    const { count, error } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .neq("plano", "basico");

    if (error) {
      console.error("Error fetching active count:", error);
      return;
    }
    setActiveCount(count || 0);
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
            <p className="text-sm text-muted-foreground">Métricas SaaS — FutGestor</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assinantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ {todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Nenhuma transação registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Time / Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{(p.teams as any)?.nome || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{planLabel(p.plano)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>{metodoLabel(p.metodo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
