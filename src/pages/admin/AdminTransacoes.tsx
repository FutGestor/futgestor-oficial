import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { type Transacao, type TransactionType } from "@/lib/types";

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

export default function AdminTransacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [formData, setFormData] = useState<TransacaoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: transacoes, isLoading } = useTransacoes();
  const { data: summary } = useFinancialSummary();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transações</h2>
          <p className="text-muted-foreground">Gerencie as finanças do time</p>
        </div>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${summary.saldoAtual >= 0 ? "text-green-600" : "text-destructive"}`}>
                R$ {summary.saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                R$ {summary.totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                R$ {summary.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
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
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
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
                    <TableCell className={`text-right font-medium ${t.tipo === "entrada" ? "text-green-600" : "text-destructive"}`}>
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma transação registrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
