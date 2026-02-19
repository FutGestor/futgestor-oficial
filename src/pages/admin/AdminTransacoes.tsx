import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTransacoes, useFinancialSummary } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { type Transacao, type TransactionType } from "@/lib/types";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Layout } from "@/components/layout/Layout";

const categorias = [
  "Mensalidade",
  "Aluguel de Campo",
  "Uniforme",
  "Arbitragem",
  "Premiação",
  "Evento",
  "Outros",
];

type TransacaoFormData = {
  data: string;
  descricao: string;
  categoria: string;
  tipo: TransactionType;
  valor: string;
};

const initialFormData: TransacaoFormData = {
  data: format(new Date(), "yyyy-MM-dd"),
  descricao: "",
  categoria: "Mensalidade",
  tipo: "entrada",
  valor: "",
};

import { useTeamConfig } from "@/hooks/useTeamConfig";

export default function AdminTransacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [formData, setFormData] = useState<TransacaoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreateDialog();
    }
  }, [searchParams]);
  const { data: transacoes, isLoading } = useTransacoes(team.id);
  const { data: summary } = useFinancialSummary(team.id);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const openCreateDialog = () => {
    setEditingTransacao(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setFormData({
      data: transacao.data,
      descricao: transacao.descricao,
      categoria: transacao.categoria,
      tipo: transacao.tipo,
      valor: transacao.valor.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        data: formData.data,
        descricao: formData.descricao,
        categoria: formData.categoria,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        team_id: profile?.team_id,
      };

      if (editingTransacao) {
        const { error } = await supabase
          .from("transacoes")
          .update(data)
          .eq("id", editingTransacao.id);

        if (error) throw error;
        toast({ title: "Transação atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("transacoes").insert(data);
        if (error) throw error;
        toast({ title: "Transação registrada com sucesso!" });

        // Notificar time sobre nova transação
        if (profile?.team_id) {
          try {
            const valorFormatado = parseFloat(formData.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
            const tipoLabel = formData.tipo === "entrada" ? "💰 Nova entrada" : "💸 Nova saída";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).rpc('notify_team', {
              p_team_id: profile.team_id,
              p_tipo: 'financeiro',
              p_titulo: `${tipoLabel} registrada!`,
              p_mensagem: `${formData.descricao} — R$ ${valorFormatado}`,
              p_link: `${basePath}/financeiro`
            });
          } catch (notifError) {
            console.warn('Falha ao enviar notificação:', notifError);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const { error } = await supabase.from("transacoes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Transação excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
      <ManagementHeader 
        title="Gerenciar Transações" 
        subtitle="Controle entradas, saídas e categorias financeiras." 
      />

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTransacao ? "Editar Transação" : "Nova Transação"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: TransactionType) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-black italic ${summary.saldoAtual >= 0 ? "text-green-400" : "text-destructive"}`}>
                R$ {summary.saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Total Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black italic text-green-400">
                R$ {summary.totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Total Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black italic text-destructive">
                R$ {summary.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transacoes && transacoes.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.map((t) => (
                      <TableRow key={t.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{t.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-white/10 bg-black/20">{t.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          {t.tipo === "entrada" ? (
                            <span className="flex items-center gap-1 text-green-400">
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
                        <TableCell className={`text-right font-black italic ${t.tipo === "entrada" ? "text-green-400" : "text-destructive"}`}>
                          {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden">
                {transacoes.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3 transition-colors hover:bg-black/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.tipo === "entrada" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{t.descricao}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(t)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{format(new Date(t.data), "dd/MM/yyyy")}</span>
                        <Badge variant="outline" className="text-xs">{t.categoria}</Badge>
                      </div>
                      <span className={`text-sm font-bold ${t.tipo === "entrada" ? "text-green-600" : "text-destructive"}`}>
                        {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma transação registrada.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
