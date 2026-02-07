import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Users, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEscalacoes, useJogos, useJogadores } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { 
  modalityLabels, 
  formacoesPorModalidade, 
  positionSlotsByFormation,
  positionSlotLabels,
  type Escalacao, 
  type Jogo, 
  type GameModality 
} from "@/lib/types";
import { SocietyField } from "@/components/SocietyField";

type EscalacaoFormData = {
  jogo_id: string;
  formacao: string;
  modalidade: GameModality;
  publicada: boolean;
  jogadores_por_posicao: Record<string, string>; // posicao_campo -> jogador_id
  banco: string[]; // jogador_id array para banco de reservas
};

const initialFormData: EscalacaoFormData = {
  jogo_id: "",
  formacao: "2-2-2",
  modalidade: "society-6",
  publicada: false,
  jogadores_por_posicao: {},
  banco: [],
};

export default function AdminEscalacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscalacao, setEditingEscalacao] = useState<(Escalacao & { jogo: Jogo }) | null>(null);
  const [formData, setFormData] = useState<EscalacaoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: escalacoes, isLoading } = useEscalacoes();
  const { data: jogos } = useJogos();
  const { data: jogadores } = useJogadores();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Jogos sem escalação ainda
  const jogosSemEscalacao = jogos?.filter(
    (j) => !escalacoes?.some((e) => e.jogo_id === j.id)
  );

  // Formações disponíveis para a modalidade selecionada
  const formacoesDisponiveis = formacoesPorModalidade[formData.modalidade];
  
  // Slots de posição disponíveis para a formação selecionada
  const positionSlots = positionSlotsByFormation[formData.formacao] || [];

  // Jogadores já alocados em alguma posição (campo + banco)
  const jogadoresAlocados = [...Object.values(formData.jogadores_por_posicao), ...formData.banco];

  const openCreateDialog = () => {
    setEditingEscalacao(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (escalacao: Escalacao & { jogo: Jogo }) => {
    setEditingEscalacao(escalacao);
    
    // Get current players in this lineup
    const { data: players } = await supabase
      .from("escalacao_jogadores")
      .select("jogador_id, posicao_campo")
      .eq("escalacao_id", escalacao.id);
    
    const jogadoresPorPosicao: Record<string, string> = {};
    const bancoJogadores: string[] = [];
    
    players?.forEach(p => {
      if (p.posicao_campo === 'banco') {
        bancoJogadores.push(p.jogador_id);
      } else {
        jogadoresPorPosicao[p.posicao_campo] = p.jogador_id;
      }
    });
    
    setFormData({
      jogo_id: escalacao.jogo_id,
      formacao: escalacao.formacao || "2-2-2",
      modalidade: ((escalacao as any).modalidade as GameModality) || "society-6",
      publicada: escalacao.publicada ?? false,
      jogadores_por_posicao: jogadoresPorPosicao,
      banco: bancoJogadores,
    });
    setIsDialogOpen(true);
  };

  const handleModalidadeChange = (modalidade: GameModality) => {
    // Quando muda a modalidade, reseta os jogadores e ajusta a formação
    const novasFormacoes = formacoesPorModalidade[modalidade];
    setFormData({
      ...formData,
      modalidade,
      formacao: novasFormacoes[0],
      jogadores_por_posicao: {},
      banco: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEscalacao) {
        // Update escalacao
        const { error } = await supabase
          .from("escalacoes")
          .update({
            formacao: formData.formacao,
            modalidade: formData.modalidade,
            publicada: formData.publicada,
          })
          .eq("id", editingEscalacao.id);

        if (error) throw error;

        // Update players - delete all and re-insert
        await supabase
          .from("escalacao_jogadores")
          .delete()
          .eq("escalacao_id", editingEscalacao.id);

        // Jogadores do campo
        const jogadoresCampo = Object.entries(formData.jogadores_por_posicao)
          .filter(([_, jogadorId]) => jogadorId)
          .map(([posicao, jogadorId], index) => ({
            escalacao_id: editingEscalacao.id,
            jogador_id: jogadorId,
            posicao_campo: posicao,
            ordem: index,
          }));

        // Jogadores do banco
        const jogadoresBanco = formData.banco.map((jogadorId, index) => ({
          escalacao_id: editingEscalacao.id,
          jogador_id: jogadorId,
          posicao_campo: 'banco',
          ordem: jogadoresCampo.length + index,
        }));

        const jogadoresParaInserir = [...jogadoresCampo, ...jogadoresBanco];

        if (jogadoresParaInserir.length > 0) {
          const { error: playersError } = await supabase
            .from("escalacao_jogadores")
            .insert(jogadoresParaInserir);

          if (playersError) throw playersError;
        }

        toast({ title: "Escalação atualizada com sucesso!" });
      } else {
        // Create new escalacao
        const { data: newEscalacao, error } = await supabase
          .from("escalacoes")
          .insert({
            jogo_id: formData.jogo_id,
            formacao: formData.formacao,
            modalidade: formData.modalidade,
            publicada: formData.publicada,
            team_id: profile?.team_id,
          })
          .select()
          .single();

        if (error) throw error;

        // Jogadores do campo
        const jogadoresCampoNovo = Object.entries(formData.jogadores_por_posicao)
          .filter(([_, jogadorId]) => jogadorId)
          .map(([posicao, jogadorId], index) => ({
            escalacao_id: newEscalacao.id,
            jogador_id: jogadorId,
            posicao_campo: posicao,
            ordem: index,
          }));

        // Jogadores do banco
        const jogadoresBancoNovo = formData.banco.map((jogadorId, index) => ({
          escalacao_id: newEscalacao.id,
          jogador_id: jogadorId,
          posicao_campo: 'banco',
          ordem: jogadoresCampoNovo.length + index,
        }));

        const jogadoresParaInserir = [...jogadoresCampoNovo, ...jogadoresBancoNovo];

        if (jogadoresParaInserir.length > 0) {
          const { error: playersError } = await supabase
            .from("escalacao_jogadores")
            .insert(jogadoresParaInserir);

          if (playersError) throw playersError;
        }

        toast({ title: "Escalação criada com sucesso!" });
      }

      queryClient.invalidateQueries({ queryKey: ["escalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["escalacao-jogadores"] });
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
    if (!confirm("Tem certeza que deseja excluir esta escalação?")) return;

    try {
      // Delete related players first (FK constraint)
      await supabase.from("escalacao_jogadores").delete().eq("escalacao_id", id);
      const { error } = await supabase.from("escalacoes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Escalação excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["escalacoes"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  const togglePublished = async (escalacao: Escalacao & { jogo: Jogo }) => {
    try {
      const { error } = await supabase
        .from("escalacoes")
        .update({ publicada: !escalacao.publicada })
        .eq("id", escalacao.id);

      if (error) throw error;
      toast({ title: escalacao.publicada ? "Escalação ocultada!" : "Escalação publicada!" });
      queryClient.invalidateQueries({ queryKey: ["escalacoes"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  // Criar preview dos jogadores para o campo
  const jogadoresPreview = Object.entries(formData.jogadores_por_posicao)
    .filter(([_, jogadorId]) => jogadorId)
    .map(([posicao, jogadorId]) => ({
      jogador: jogadores?.find(j => j.id === jogadorId)!,
      posicao_campo: posicao,
    }))
    .filter(item => item.jogador);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Escalações</h2>
          <p className="text-muted-foreground">Monte a escalação para os jogos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} disabled={!jogosSemEscalacao?.length && !editingEscalacao}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Escalação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEscalacao ? "Editar Escalação" : "Nova Escalação"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="jogo_id">Jogo</Label>
                  <Select
                    value={formData.jogo_id}
                    onValueChange={(value) => setFormData({ ...formData, jogo_id: value })}
                    disabled={!!editingEscalacao}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o jogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingEscalacao && (
                        <SelectItem value={editingEscalacao.jogo_id}>
                          vs {editingEscalacao.jogo.adversario} - {format(new Date(editingEscalacao.jogo.data_hora), "dd/MM/yyyy")}
                        </SelectItem>
                      )}
                      {jogosSemEscalacao?.map((jogo) => (
                        <SelectItem key={jogo.id} value={jogo.id}>
                          vs {jogo.adversario} - {format(new Date(jogo.data_hora), "dd/MM/yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modalidade">Modalidade</Label>
                  <Select
                    value={formData.modalidade}
                    onValueChange={(value) => handleModalidadeChange(value as GameModality)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(modalityLabels) as GameModality[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {modalityLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formacao">Formação</Label>
                  <Select
                    value={formData.formacao}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      formacao: value,
                      jogadores_por_posicao: {}, // Reset jogadores ao mudar formação
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formacoesDisponiveis.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="publicada"
                  checked={formData.publicada}
                  onCheckedChange={(checked) => setFormData({ ...formData, publicada: checked })}
                />
                <Label htmlFor="publicada">Publicar escalação</Label>
              </div>

              {/* Campo visual + seleção de jogadores lado a lado */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Preview do campo */}
                <div>
                  <Label className="mb-2 block">Visualização do Campo</Label>
                  <SocietyField
                    modalidade={formData.modalidade}
                    formacao={formData.formacao}
                    jogadores={jogadoresPreview}
                    className="mx-auto"
                  />
                </div>

                {/* Seleção de jogadores por posição */}
                <div className="space-y-3">
                  <Label>Selecionar Jogadores por Posição ({jogadoresAlocados.length}/{positionSlots.length})</Label>
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
                    {positionSlots.map((posicao) => (
                      <div key={posicao} className="flex items-center gap-2 rounded-lg border p-2">
                        <span className="w-20 text-sm font-medium text-muted-foreground">
                          {positionSlotLabels[posicao]}
                        </span>
                        <Select
                          value={formData.jogadores_por_posicao[posicao] || "__none__"}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            jogadores_por_posicao: {
                              ...formData.jogadores_por_posicao,
                              [posicao]: value === "__none__" ? "" : value,
                            },
                          })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {jogadores?.filter(j => 
                              !jogadoresAlocados.includes(j.id) || 
                              formData.jogadores_por_posicao[posicao] === j.id
                            ).map((jogador) => (
                              <SelectItem key={jogador.id} value={jogador.id}>
                                {jogador.numero && <span className="mr-1 font-bold">{jogador.numero}</span>}
                                {jogador.apelido || jogador.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção Banco de Reservas */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">🪑 Banco de Reservas ({formData.banco.length} jogadores)</Label>
                </div>
                
                {/* Adicionar jogador ao banco */}
                <div className="flex gap-2">
                  <Select
                    value="__add__"
                    onValueChange={(value) => {
                      if (value !== "__add__") {
                        setFormData({
                          ...formData,
                          banco: [...formData.banco, value],
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar jogador ao banco..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__add__" disabled>Selecione um jogador...</SelectItem>
                      {jogadores?.filter(j => 
                        !jogadoresAlocados.includes(j.id)
                      ).map((jogador) => (
                        <SelectItem key={jogador.id} value={jogador.id}>
                          {jogador.numero && <span className="mr-1 font-bold">{jogador.numero}</span>}
                          {jogador.apelido || jogador.nome} - {jogador.posicao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de jogadores no banco */}
                {formData.banco.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.banco.map((jogadorId) => {
                      const jogador = jogadores?.find(j => j.id === jogadorId);
                      if (!jogador) return null;
                      return (
                        <div
                          key={jogadorId}
                          className="flex items-center gap-2 rounded-full bg-muted px-3 py-1"
                        >
                          <span className="text-sm">
                            {jogador.numero && <span className="mr-1 font-bold">{jogador.numero}</span>}
                            {jogador.apelido || jogador.nome}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              banco: formData.banco.filter(id => id !== jogadorId),
                            })}
                            className="rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {formData.banco.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum jogador no banco. Adicione jogadores usando o seletor acima.</p>
                )}
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
      ) : escalacoes && escalacoes.length > 0 ? (
        <div className="space-y-4">
          {escalacoes.map((escalacao) => (
            <Card key={escalacao.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">vs {escalacao.jogo?.adversario}</span>
                      <Badge variant="secondary">{escalacao.formacao}</Badge>
                      <Badge variant="outline">
                        {modalityLabels[((escalacao as any).modalidade as GameModality) || 'society-6']}
                      </Badge>
                      {escalacao.publicada ? (
                        <Badge variant="default">Publicada</Badge>
                      ) : (
                        <Badge variant="outline">Rascunho</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {escalacao.jogo?.data_hora && format(new Date(escalacao.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublished(escalacao)}
                    title={escalacao.publicada ? "Ocultar" : "Publicar"}
                  >
                    {escalacao.publicada ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(escalacao)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(escalacao.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Nenhuma escalação criada.</p>
            {jogosSemEscalacao && jogosSemEscalacao.length > 0 && (
              <p className="mt-2 text-sm">
                Há {jogosSemEscalacao.length} jogo(s) aguardando escalação.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
