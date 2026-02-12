import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useResultados, useJogos } from "@/hooks/useData";
import { type Resultado } from "@/lib/types";
import EstatisticasPartidaForm from "@/components/EstatisticasPartidaForm";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useAuth } from "@/hooks/useAuth";

type ResultadoFormData = {
  jogo_id: string;
  gols_favor: string;
  gols_contra: string;
  observacoes: string;
};

const initialFormData: ResultadoFormData = {
  jogo_id: "",
  gols_favor: "0",
  gols_contra: "0",
  observacoes: "",
};

export default function AdminResultados() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedResultadoId, setSelectedResultadoId] = useState<string | null>(null);
  const [editingResultado, setEditingResultado] = useState<Resultado | null>(null);
  const [formData, setFormData] = useState<ResultadoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { team } = useTeamConfig();
  const { data: resultados, isLoading } = useResultados(team.id);
  const { data: jogos } = useJogos(team.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Jogos sem resultado ainda
  const jogosSemResultado = jogos?.filter(
    (j) => !resultados?.some((r) => r.jogo_id === j.id)
  );

  const openCreateDialog = () => {
    setEditingResultado(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (resultado: Resultado) => {
    setEditingResultado(resultado);
    setFormData({
      jogo_id: resultado.jogo_id,
      gols_favor: resultado.gols_favor.toString(),
      gols_contra: resultado.gols_contra.toString(),
      observacoes: resultado.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        jogo_id: formData.jogo_id,
        gols_favor: parseInt(formData.gols_favor),
        gols_contra: parseInt(formData.gols_contra),
        observacoes: formData.observacoes || null,
        team_id: profile?.team_id,
      };

      if (editingResultado) {
        const { error } = await supabase
          .from("resultados")
          .update(data)
          .eq("id", editingResultado.id);

        if (error) throw error;

        // Update game status to finalized
        await supabase
          .from("jogos")
          .update({ status: "finalizado" })
          .eq("id", formData.jogo_id);

        toast({ title: "Resultado atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("resultados").insert(data);
        if (error) throw error;

        // Update game status to finalized
        await supabase
          .from("jogos")
          .update({ status: "finalizado" })
          .eq("id", formData.jogo_id);

        toast({ title: "Resultado registrado com sucesso!" });
      }

      queryClient.invalidateQueries({ queryKey: ["resultados"] });
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
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
    if (!confirm("Tem certeza que deseja excluir este resultado?")) return;

    try {
      const { error } = await supabase.from("resultados").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Resultado excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["resultados"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  const getResultType = (golsFavor: number, golsContra: number) => {
    if (golsFavor > golsContra) return "vitoria";
    if (golsFavor < golsContra) return "derrota";
    return "empate";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resultados</h2>
          <p className="text-muted-foreground">Registre os resultados das partidas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} disabled={!jogosSemResultado?.length && !editingResultado}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Resultado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingResultado ? "Editar Resultado" : "Registrar Resultado"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jogo_id">Jogo</Label>
                <Select
                  value={formData.jogo_id}
                  onValueChange={(value) => setFormData({ ...formData, jogo_id: value })}
                  disabled={!!editingResultado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingResultado && resultados?.find(r => r.id === editingResultado.id)?.jogo && (
                      <SelectItem value={editingResultado.jogo_id}>
                        vs {resultados.find(r => r.id === editingResultado.id)?.jogo?.adversario} - {format(new Date(resultados.find(r => r.id === editingResultado.id)?.jogo?.data_hora || ''), "dd/MM/yyyy")}
                      </SelectItem>
                    )}
                    {jogosSemResultado?.map((jogo) => (
                      <SelectItem key={jogo.id} value={jogo.id}>
                        vs {jogo.adversario} - {format(new Date(jogo.data_hora), "dd/MM/yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gols_favor">Gols do Time</Label>
                  <Input
                    id="gols_favor"
                    type="number"
                    min="0"
                    value={formData.gols_favor}
                    onChange={(e) => setFormData({ ...formData, gols_favor: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gols_contra">Gols Adversário</Label>
                  <Input
                    id="gols_contra"
                    type="number"
                    min="0"
                    value={formData.gols_contra}
                    onChange={(e) => setFormData({ ...formData, gols_contra: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Destaques, gols marcados, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.jogo_id}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : resultados && resultados.length > 0 ? (
        <div className="space-y-4">
          {resultados.map((resultado) => {
            const tipo = getResultType(resultado.gols_favor, resultado.gols_contra);
            return (
              <Card key={resultado.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className={`h-6 w-6 shrink-0 sm:h-8 sm:w-8 ${tipo === "vitoria" ? "text-green-600" : tipo === "derrota" ? "text-destructive" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="text-sm font-semibold sm:text-base">{team.nome}</span>
                        <span className={`rounded px-1.5 py-0.5 text-sm font-bold sm:px-2 sm:py-1 sm:text-lg ${tipo === "vitoria" ? "bg-green-100 text-green-800" :
                          tipo === "derrota" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                          {resultado.gols_favor} x {resultado.gols_contra}
                        </span>
                        <span className="text-sm font-semibold sm:text-base">{resultado.jogo?.adversario}</span>
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {resultado.jogo?.data_hora && format(new Date(resultado.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={tipo === "vitoria" ? "default" : tipo === "derrota" ? "destructive" : "secondary"}>
                      {tipo === "vitoria" ? "Vitória" : tipo === "derrota" ? "Derrota" : "Empate"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setSelectedResultadoId(resultado.id);
                        setStatsDialogOpen(true);
                      }}
                    >
                      <Users className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Estatísticas</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(resultado)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(resultado.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Nenhum resultado registrado.</p>
            {jogosSemResultado && jogosSemResultado.length > 0 && (
              <p className="mt-2 text-sm">
                Há {jogosSemResultado.length} jogo(s) aguardando resultado.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para Estatísticas */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estatísticas da Partida</DialogTitle>
          </DialogHeader>
          {selectedResultadoId && (
            <EstatisticasPartidaForm
              resultadoId={selectedResultadoId}
              onSave={() => setStatsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
