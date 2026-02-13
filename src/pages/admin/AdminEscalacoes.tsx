import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Users, Eye, EyeOff, X, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { useEscalacoes, useJogos, useJogadores } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import {
  modalityLabels,
  formacoesPorModalidade,
  positionSlotsByFormation,
  positionSlotLabels,
  positionLabels,
  formationPositions,
  type GameModality,
  type Escalacao,
  type Jogo,
} from "@/lib/types";
import { SocietyField } from "@/components/SocietyField";
import { useTacticalAssistant } from "@/hooks/useTacticalAssistant";

type EscalacaoFormData = {
  jogo_id: string;
  formacao: string;
  modalidade: GameModality;
  publicada: boolean;
  jogadores_por_posicao: Record<string, string>; // slot -> jogador_id
  posicoes_customizadas: Record<string, string>; // jogador_id -> "label|top|left"
  banco: string[]; // jogador_id array para banco de reservas
};

const initialFormData: EscalacaoFormData = {
  jogo_id: "",
  formacao: "2-2-2",
  modalidade: "society-6",
  publicada: false,
  jogadores_por_posicao: {},
  posicoes_customizadas: {},
  banco: [],
};

import { useTeamConfig } from "@/hooks/useTeamConfig";

export default function AdminEscalacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscalacao, setEditingEscalacao] = useState<(Escalacao & { jogo: Jogo }) | null>(null);
  const [formData, setFormData] = useState<EscalacaoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { team } = useTeamConfig();
  const { data: escalacoes, isLoading } = useEscalacoes(team.id);
  const { data: jogos } = useJogos(team.id);
  const { data: jogadores } = useJogadores(true, team.id);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { suggestLineup, ratedPlayers, isLoading: isLoadingAI } = useTacticalAssistant(team.id);

  const handleSuggestLineup = () => {
    // 1. Identificar slots da formação atual
    const slots = positionSlotsByFormation[formData.formacao] || [];
    
    // 2. Pedir sugestão para a IA
    const suggestion = suggestLineup(formData.formacao, slots);

    // 3. Processar sugestão para o formato do formulário
    const novosJogadoresPorPosicao: Record<string, string> = {};
    const novoBanco: string[] = [];
    const idsNoCampo = new Set<string>();

    // Inicializar os slots válidos
    const validSlots = slots;
    validSlots.forEach(slot => { 
      novosJogadoresPorPosicao[slot] = ""; 
    });

    // Pass 1: Tentar preencher os slots com as sugestões da IA
    suggestion.filter(s => s.posicao_campo !== 'banco').forEach(item => {
      if (validSlots.includes(item.posicao_campo) && !idsNoCampo.has(item.jogador.id)) {
        novosJogadoresPorPosicao[item.posicao_campo] = item.jogador.id;
        idsNoCampo.add(item.jogador.id);
      }
    });

    // Pass 2: Se houver slots vazios, preencher com quem a IA sugeriu para o banco ou sobrou
    const slotsVazios = validSlots.filter(s => !novosJogadoresPorPosicao[s]);
    if (slotsVazios.length > 0) {
      const restantes = suggestion
        .filter(s => !idsNoCampo.has(s.jogador.id))
        .map(s => s.jogador.id);
      
      slotsVazios.forEach((slot, i) => {
        if (restantes[i]) {
          novosJogadoresPorPosicao[slot] = restantes[i];
          idsNoCampo.add(restantes[i]);
        }
      });
    }

    // Pass 3: O que sobrou de verdade vai para o banco
    suggestion.forEach(item => {
      if (!idsNoCampo.has(item.jogador.id)) {
        novoBanco.push(item.jogador.id);
        idsNoCampo.add(item.jogador.id);
      }
    });

    setFormData(prev => ({
      ...prev,
      jogadores_por_posicao: novosJogadoresPorPosicao,
      banco: novoBanco,
      posicoes_customizadas: {}, 
    }));

    toast({
      title: "Escalação sugerida!",
      description: "A IA selecionou os melhores jogadores disponíveis para cada posição.",
    });
  };

  // Jogos sem escalação ainda
  const jogosSemEscalacao = jogos?.filter(
    (j) => !escalacoes?.some((e) => e.jogo_id === j.id)
  );

  // Formações disponíveis para a modalidade selecionada
  const formacoesDisponiveis = formacoesPorModalidade[formData.modalidade];

  // Slots de posição disponíveis para a formação selecionada
  const positionSlots = positionSlotsByFormation[formData.formacao] || [];

  // Sincronizador de Formação: Mantém o estado dos jogadores perfeitamente alinhado com a tática
  useEffect(() => {
    const slotsAtuais = new Set(positionSlots);
    const novosJogadores: Record<string, string> = {};
    const idsUsados = new Set<string>();

    // 1. Manter slots atuais que já estão preenchidos
    Object.entries(formData.jogadores_por_posicao).forEach(([slot, id]) => {
      if (id && slotsAtuais.has(slot) && !idsUsados.has(id)) {
        novosJogadores[slot] = id;
        idsUsados.add(id);
      }
    });

    // 2. Garantir que todos os slots da formação existam no objeto (vazios se necessário)
    positionSlots.forEach(slot => {
      if (!novosJogadores[slot]) {
        novosJogadores[slot] = "";
      }
    });

    // 3. Verificar se houve mudança real (chaves ou valores)
    const keysAtuais = Object.keys(formData.jogadores_por_posicao).sort();
    const keysNovas = Object.keys(novosJogadores).sort();
    const mudouKeys = JSON.stringify(keysAtuais) !== JSON.stringify(keysNovas);
    const mudouValores = keysNovas.some(k => formData.jogadores_por_posicao[k] !== novosJogadores[k]);

    if (mudouKeys || mudouValores) {
      setFormData(prev => ({
        ...prev,
        jogadores_por_posicao: novosJogadores
      }));
    }
  }, [formData.formacao, positionSlots]);

  // Jogadores escalados no campo (apenas os que pertencem aos slots da formação atual)
  const titularesEscalados = Object.entries(formData.jogadores_por_posicao)
    .filter(([slot, id]) => id && positionSlots.includes(slot))
    .map(([_, id]) => id);

  // Todos os jogadores já alocados (campo + banco) para evitar duplicidade no seletor
  const todosJogadoresAlocados = [
    ...titularesEscalados,
    ...formData.banco
  ].filter(id => id);

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
    const posicoesCustomizadas: Record<string, string> = {};
    const bancoJogadores: string[] = [];

    // Mapear slots disponíveis da formação para preencher o Record
    const slots = positionSlotsByFormation[escalacao.formacao || "2-2-2"] || [];

    players?.forEach((p, index) => {
      if (p.posicao_campo === 'banco') {
        bancoJogadores.push(p.jogador_id);
      } else {
        // Se a posição for customizada (contém |), guardamos no objeto de customização
        if (p.posicao_campo.includes('|')) {
          posicoesCustomizadas[p.jogador_id] = p.posicao_campo;
          // E associamos a um slot disponível (ou o index se faltar slots nominais)
          const slot = slots[index] || `pos-${index}`;
          jogadoresPorPosicao[slot] = p.jogador_id;
        } else {
          jogadoresPorPosicao[p.posicao_campo] = p.jogador_id;
        }
      }
    });

    setFormData({
      jogo_id: escalacao.jogo_id,
      formacao: escalacao.formacao || "2-2-2",
      modalidade: ((escalacao as any).modalidade as GameModality) || "society-6",
      publicada: escalacao.publicada ?? false,
      jogadores_por_posicao: jogadoresPorPosicao,
      posicoes_customizadas: posicoesCustomizadas,
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
      jogadores_por_posicao: {}, // Limpeza total
      posicoes_customizadas: {}, // Limpeza total
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

        // Jogadores do campo - Filtrar apenas slots VÁLIDOS para a formação atual
        const jogadoresCampo = Object.entries(formData.jogadores_por_posicao)
          .filter(([slot, jogadorId]) => jogadorId && positionSlotsByFormation[formData.formacao].includes(slot))
          .map(([slot, jogadorId], index) => ({
            escalacao_id: editingEscalacao.id,
            jogador_id: jogadorId,
            posicao_campo: formData.posicoes_customizadas[jogadorId] || slot,
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

        // Jogadores do campo - Filtrar apenas slots VÁLIDOS para a formação atual
        const jogadoresCampoNovo = Object.entries(formData.jogadores_por_posicao)
          .filter(([slot, jogadorId]) => jogadorId && positionSlotsByFormation[formData.formacao].includes(slot))
          .map(([slot, jogadorId], index) => ({
            escalacao_id: newEscalacao.id,
            jogador_id: jogadorId,
            posicao_campo: formData.posicoes_customizadas[jogadorId] || slot,
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

  // Logic for field preview
  const jogadoresPreview = useMemo(() => {
    const basePositions = formationPositions[formData.formacao] || {};
    
    return Object.entries(formData.jogadores_por_posicao)
      .filter(([slot, jogadorId]) => {
        // Só renderiza se o jogador existir e o slot pertencer à formação atual
        return jogadorId && basePositions[slot];
      })
      .map(([slot, jogadorId]) => ({
        jogador: jogadores?.find(j => j.id === jogadorId)!,
        posicao_campo: formData.posicoes_customizadas[jogadorId] || slot,
      }))
      .filter(item => item.jogador);
  }, [formData.jogadores_por_posicao, formData.formacao, formData.posicoes_customizadas, jogadores]);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Escalações</h2>
          <p className="text-muted-foreground">Monte a escalação para os jogos</p>
        </div>
        <div className="flex gap-2">
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
                        posicoes_customizadas: {}, // Reset coordenadas
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

                {/* Botão da IA */}
                <div className="flex justify-end items-center gap-2">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <Info className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            Como funciona a IA?
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            O Assistente Tático usa um algoritmo de <strong>aprendizado contínuo</strong> para sugerir a melhor formação.
                          </p>
                          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                            <li><strong>Sem dados:</strong> Usa atributos base da posição.</li>
                            <li><strong>Com dados:</strong> Aprende com gols, assistências e notas de partidas reais.</li>
                            <li>Quanto mais jogos lançados, mais precisa fica a sugestão.</li>
                          </ul>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    <Button 
                        type="button" 
                        variant="secondary" 
                        className="gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 text-indigo-400"
                        onClick={handleSuggestLineup}
                        disabled={isLoadingAI || ratedPlayers.length === 0}
                    >
                        {isLoadingAI ? (
                          <span className="animate-spin mr-2">⏳</span>
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Sugerir Escalação com IA
                    </Button>
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
                    <Label className="mb-2 block">Visualização do Campo (Arraste os jogadores)</Label>
                    <SocietyField
                        modalidade={formData.modalidade}
                        formacao={formData.formacao}
                        jogadores={jogadoresPreview}
                        className="mx-auto"
                        isEditable={true}
                        onPlayerMove={(jogadorId, encodedPos) => {
                        setFormData(prev => ({
                            ...prev,
                            posicoes_customizadas: {
                            ...prev.posicoes_customizadas,
                            [jogadorId]: encodedPos
                            }
                        }));
                        }}
                    />
                    </div>

                    {/* Seleção de jogadores por posição */}
                    <div className="space-y-3">
                    <Label>Selecionar Jogadores por Posição ({titularesEscalados.length}/{positionSlots.length})</Label>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
                        {positionSlots.map((posicao) => (
                        <div key={posicao} className="flex items-center gap-2 rounded-lg border p-2">
                            <span className="w-20 text-sm font-medium text-muted-foreground text-center">
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
                                !todosJogadoresAlocados.includes(j.id) ||
                                formData.jogadores_por_posicao[posicao] === j.id
                                ).map((jogador) => (
                                <SelectItem key={jogador.id} value={jogador.id}>
                                    <div className="flex items-center gap-2">
                                    {jogador.numero !== null && (
                                        <Badge variant="outline" className="h-5 px-1 font-mono text-xs">
                                        #{jogador.numero}
                                        </Badge>
                                    )}
                                    <span className="font-medium">{jogador.apelido || jogador.nome}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {positionLabels[jogador.posicao]}
                                    </span>
                                    </div>
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
                            !todosJogadoresAlocados.includes(j.id)
                        ).map((jogador) => (
                            <SelectItem key={jogador.id} value={jogador.id}>
                            <div className="flex items-center gap-2">
                                {jogador.numero !== null && (
                                <Badge variant="outline" className="h-5 px-1 font-mono text-xs">
                                    #{jogador.numero}
                                </Badge>
                                )}
                                <span className="font-medium">{jogador.apelido || jogador.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                {positionLabels[jogador.posicao]}
                                </span>
                            </div>
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
                                {jogador.numero !== null && <span className="mr-1 font-bold">#{jogador.numero}</span>}
                                {jogador.apelido || jogador.nome}
                                <span className="ml-1 text-xs opacity-70">
                                ({positionLabels[jogador.posicao]})
                                </span>
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
      </div>
{/* Resto do componente mantido (lista de cards etc) */}
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
                  <Users className="h-8 w-8 text-foreground" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">vs {escalacao.jogo?.adversario || "Jogo removido"}</span>
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
