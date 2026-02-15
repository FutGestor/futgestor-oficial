import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Users, Check, X, Shield, List, ChevronLeft, ChevronRight, ArrowUpDown, Trophy } from "lucide-react";
import PresencaLinkDialog from "@/components/PresencaLinkDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJogos, useResultados } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useTimesAtivos } from "@/hooks/useTimes";
import { useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import { statusLabels, type Jogo, type GameStatus, type Resultado } from "@/lib/types";
import AdminPresencaManager from "@/components/AdminPresencaManager";
import EstatisticasPartidaForm from "@/components/EstatisticasPartidaForm";
import { cn } from "@/lib/utils";
import { usePlanAccess } from "@/hooks/useSubscription";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { TimePickerSelect } from "@/components/ui/time-picker-select";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Layout } from "@/components/layout/Layout";

type JogoFormData = {
  data_hora: string;
  local: string;
  adversario: string;
  time_adversario_id: string | null;
  status: GameStatus;
  observacoes: string;
};

type ResultadoFormData = {
  jogo_id: string;
  gols_favor: string;
  gols_contra: string;
  observacoes: string;
};

const initialFormData: JogoFormData = {
  data_hora: "",
  local: "",
  adversario: "",
  time_adversario_id: null,
  status: "agendado",
  observacoes: "",
};

const initialResultFormData: ResultadoFormData = {
  jogo_id: "",
  gols_favor: "0",
  gols_contra: "0",
  observacoes: "",
};

export default function AdminJogos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJogoId, setSelectedJogoId] = useState<string | null>(null);
  const [editingJogo, setEditingJogo] = useState<Jogo | null>(null);
  const [formData, setFormData] = useState<JogoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Resultado
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedResultadoId, setSelectedResultadoId] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<Resultado | null>(null);
  const [resultFormData, setResultFormData] = useState<ResultadoFormData>(initialResultFormData);

  // Estados para visualização de calendário
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();
  const { data: jogos, isLoading: loadingJogos } = useJogos(team.id);
  const { data: resultados, isLoading: loadingResultados } = useResultados(team.id);
  
  const { profile } = useAuth();
  const { data: times } = useTimesAtivos(profile?.team_id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreateDialog();
    }
  }, [searchParams]);

  const isLoading = loadingJogos || loadingResultados;

  // Funções auxiliares para o calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayGames = (date: Date) => {
    return jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];
  };

  const jogosDoDia = selectedDate ? getDayGames(selectedDate) : [];

  // Ordenação Inteligente de Jogos
  const jogosSorted = [...(jogos || [])].sort((a, b) => {
    const resultadoA = resultados?.find(r => r.jogo_id === a.id);
    const resultadoB = resultados?.find(r => r.jogo_id === b.id);
    
    // Verificar se tem estatísticas preenchidas
    // O hook useResultados agora retorna estatisticas_partida: [{ count: number }]
    const hasStatsA = resultadoA && resultadoA.estatisticas_partida && resultadoA.estatisticas_partida.length > 0;
    const hasStatsB = resultadoB && resultadoB.estatisticas_partida && resultadoB.estatisticas_partida.length > 0;

    // Critério 1: Jogos Finalizados E com Resultado E com Estatísticas vão para o final
    // Jogos pendentes de qualquer requisito ficam no topo para chamar atenção
    const isCompletedA = a.status === 'finalizado' && !!resultadoA && !!hasStatsA;
    const isCompletedB = b.status === 'finalizado' && !!resultadoB && !!hasStatsB;

    if (isCompletedA !== isCompletedB) {
      return isCompletedA ? 1 : -1; // Concluídos vão para o final
    }

    const dateA = new Date(a.data_hora).getTime();
    const dateB = new Date(b.data_hora).getTime();

    // Critério 2: Ordenação interna
    if (!isCompletedA) {
      // Grupo Pendentes: Ordenar por Data Crescente (Próximos compromissos primeiro)
      return dateA - dateB;
    } else {
      // Grupo Concluídos: Ordenar por Data Decrescente (Histórico recente primeiro)
      return dateB - dateA;
    }
  });

  const openCreateDialog = (date?: Date) => {
    setEditingJogo(null);
    if (date) {
      setFormData({
        ...initialFormData,
        data_hora: `${format(date, "yyyy-MM-dd")}T19:00`,
      });
    } else {
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (jogo: Jogo) => {
    setEditingJogo(jogo);
    setFormData({
      data_hora: format(new Date(jogo.data_hora), "yyyy-MM-dd'T'HH:mm"),
      local: jogo.local,
      adversario: jogo.adversario,
      time_adversario_id: jogo.time_adversario_id,
      status: jogo.status,
      observacoes: jogo.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const openResultDialog = (jogo: Jogo, resultado?: Resultado) => {
    if (resultado) {
      setEditingResult(resultado);
      setResultFormData({
        jogo_id: resultado.jogo_id,
        gols_favor: resultado.gols_favor.toString(),
        gols_contra: resultado.gols_contra.toString(),
        observacoes: resultado.observacoes || "",
      });
    } else {
      setEditingResult(null);
      setResultFormData({
        ...initialResultFormData,
        jogo_id: jogo.id
      });
    }
    setIsResultDialogOpen(true);
  };

  const handleTimeChange = (timeId: string) => {
    if (timeId === "manual") {
      setFormData({ ...formData, time_adversario_id: null });
    } else {
      const selectedTime = times?.find(t => t.id === timeId);
      if (selectedTime) {
        setFormData({
          ...formData,
          time_adversario_id: timeId,
          adversario: selectedTime.nome,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataHoraISO = new Date(formData.data_hora).toISOString();

      if (editingJogo) {
        const { error } = await supabase
          .from("jogos")
          .update({
            data_hora: dataHoraISO,
            local: formData.local,
            adversario: formData.adversario,
            time_adversario_id: formData.time_adversario_id,
            status: formData.status,
            observacoes: formData.observacoes || null,
          })
          .eq("id", editingJogo.id);

        if (error) throw error;
        toast({ title: "Jogo atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("jogos").insert({
          data_hora: dataHoraISO,
          local: formData.local,
          adversario: formData.adversario,
          time_adversario_id: formData.time_adversario_id,
          status: formData.status,
          observacoes: formData.observacoes || null,
          team_id: profile?.team_id,
        });

        if (error) throw error;
        toast({ title: "Jogo criado com sucesso!" });
      }

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

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        jogo_id: resultFormData.jogo_id,
        gols_favor: parseInt(resultFormData.gols_favor),
        gols_contra: parseInt(resultFormData.gols_contra),
        observacoes: resultFormData.observacoes || null,
        team_id: profile?.team_id,
      };

      if (editingResult) {
        const { error } = await supabase
          .from("resultados")
          .update(data)
          .eq("id", editingResult.id);

        if (error) throw error;
        toast({ title: "Resultado atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("resultados").insert(data);
        if (error) throw error;
        toast({ title: "Resultado registrado com sucesso!" });
        
        // Atualizar status do jogo para finalizado se for novo resultado
        await supabase
          .from("jogos")
          .update({ status: "finalizado" })
          .eq("id", resultFormData.jogo_id);
      }

      await queryClient.invalidateQueries({ queryKey: ["resultados"] });
      await queryClient.invalidateQueries({ queryKey: ["jogos"] });
      
      setIsResultDialogOpen(false);

      // Abrir automaticamente modal de estatísticas após registrar resultado
      const resId = editingResult?.id || ""; // Caso seja edição
      // Se for novo, precisamos do ID do resultado recém criado.
      // Vou buscar o resultado associado ao jogo.
      const { data: newRes } = await supabase
        .from("resultados")
        .select("id")
        .eq("jogo_id", resultFormData.jogo_id)
        .maybeSingle();

      if (newRes?.id) {
        setSelectedResultadoId(newRes.id);
        setStatsDialogOpen(true);
      }
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
    if (!confirm("Tem certeza que deseja excluir este jogo?")) return;

    try {
      const { error } = await supabase.from("jogos").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Jogo excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };
  
  const handleUpdateStatus = async (jogoId: string, newStatus: GameStatus) => {
    try {
      const { error } = await supabase
        .from("jogos")
        .update({ status: newStatus })
        .eq("id", jogoId);

      if (error) throw error;
      toast({ title: "Status atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
      });
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day);
  };

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
        <ManagementHeader 
        title="Gerenciar Agenda" 
        subtitle="Agende partidas, registre resultados e controle presenças." 
      />

      <div className="space-y-4">
        {/* Linha 1: Título + Botão Novo Jogo */}
        <div className="flex items-start justify-end gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreateDialog()} size="sm" className="shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">ADICIONAR PARTIDA</span>
                <span className="sm:hidden">ADICIONAR</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingJogo ? "Editar Jogo" : "Novo Jogo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Adversário</Label>
                  <Select
                    value={formData.time_adversario_id || "manual"}
                    onValueChange={handleTimeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um time ou digite manualmente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Digitar manualmente</SelectItem>
                      {times?.filter(t => !t.is_casa).map((time) => (
                        <SelectItem key={time.id} value={time.id}>
                          <div className="flex items-center gap-2">
                            <img src={time.escudo_url || ESCUDO_PADRAO} alt="" className="h-5 w-5 rounded-full object-contain" />
                            {time.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!formData.time_adversario_id && (
                  <div className="space-y-2">
                    <Label htmlFor="adversario">Nome do Adversário</Label>
                    <Input
                      id="adversario"
                      value={formData.adversario}
                      onChange={(e) => setFormData({ ...formData, adversario: e.target.value })}
                      placeholder="Digite o nome do time adversário"
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <DatePickerPopover
                      date={formData.data_hora ? new Date(formData.data_hora) : undefined}
                      setDate={(date) => {
                        if (date) {
                          const currentTime = formData.data_hora ? formData.data_hora.split('T')[1] : "19:00";
                          setFormData({
                            ...formData,
                            data_hora: `${format(date, "yyyy-MM-dd")}T${currentTime}`,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <TimePickerSelect
                      value={formData.data_hora ? formData.data_hora.split('T')[1] : undefined}
                      onChange={(time) => {
                        const currentDate = formData.data_hora ? formData.data_hora.split('T')[0] : format(new Date(), "yyyy-MM-dd");
                        setFormData({
                          ...formData,
                          data_hora: `${currentDate}T${time}`,
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: GameStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 sm:h-10">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-11 sm:h-10">
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Linha 2: Controles de visualização */}
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "list" | "calendar")}
          >
            <ToggleGroupItem value="list" aria-label="Visualização em lista">
              <List className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Lista</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Visualização em calendário">
              <Calendar className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Calendário</span>
            </ToggleGroupItem>
          </ToggleGroup>


        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : viewMode === "list" ? (
        // Modo Lista
        jogosSorted.length > 0 ? (
          <div className="space-y-4">
            {jogosSorted.map((jogo) => {
              const resultado = resultados?.find(r => r.jogo_id === jogo.id);
              return (
                <JogoCard
                  key={jogo.id}
                  jogo={jogo}
                  resultado={resultado}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  className="bg-black/40 backdrop-blur-xl border-white/10"
                  onViewConfirmacoes={(id) => {
                    setSelectedJogoId(id);
                    setConfirmDialogOpen(true);
                  }}
                  onStatusChange={handleUpdateStatus}
                  onRegisterResult={(jogo) => openResultDialog(jogo)}
                  onEditResult={(jogo, res) => openResultDialog(jogo, res)}
                  onViewStats={(resId) => {
                    setSelectedResultadoId(resId);
                    setStatsDialogOpen(true);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum jogo cadastrado.
            </CardContent>
          </Card>
        )
      ) : (
        // Modo Calendário
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendário */}
          <Card className="lg:col-span-2 bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Cabeçalho dos dias da semana */}
              <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              {/* Grid do calendário */}
              <div className="grid grid-cols-7 gap-1">
                {/* Células vazias para dias antes do início do mês */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthDays.map((day) => {
                  const dayGames = getDayGames(day);
                  const hasGames = dayGames.length > 0;
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  // Pegar o primeiro jogo do dia para exibir o escudo
                  const firstGame = dayGames[0];
                  const time = firstGame?.time_adversario;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer",
                        isToday && !isSelected && "bg-primary text-primary-foreground",
                        isSelected && "ring-2 ring-primary ring-offset-2",
                        hasGames && !isToday && !isSelected && "bg-white/10 backdrop-blur-md text-card-foreground border-white/10",
                        !hasGames && !isToday && "bg-secondary/10 hover:bg-secondary/20"
                      )}
                    >
                      {/* Número do dia */}
                      <span className={cn(
                        "absolute left-1 top-0.5 text-[10px] font-medium z-20",
                        hasGames && "font-extrabold bg-transparent/50 rounded-sm px-0.5"
                      )}>
                        {format(day, "d")}
                      </span>

                      {/* Escudo ocupando todo o quadrado */}
                      {hasGames && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5 opacity-60">
                          <img
                            src={time?.escudo_url || ESCUDO_PADRAO}
                            alt={time?.nome || firstGame.adversario}
                            className="h-full w-full rounded-full object-contain"
                          />
                        </div>
                      )}

                      {/* Abreviação do time (posicionada abaixo do número) */}
                      {hasGames && !time?.escudo_url && (
                        <div className="absolute inset-0 flex items-center justify-center pt-3">
                          <span className="text-xs font-bold uppercase">
                            {(time?.apelido || time?.nome || firstGame?.adversario || "").substring(0, 3)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lista de jogos do dia selecionado */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedDate
                    ? `Jogos em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
                    : "Selecione um dia"
                  }
                </h3>
                {selectedDate && (
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => openCreateDialog(selectedDate)}>
                    <Plus className="h-4 w-4" />
                    Adicionar Jogo
                  </Button>
                )}
              </div>

            {selectedDate ? (
              jogosDoDia.length > 0 ? (
                <div className="space-y-4">
                  {jogosDoDia.map((jogo) => {
                    const resultado = resultados?.find(r => r.jogo_id === jogo.id);
                    return (
                      <JogoCard
                        key={jogo.id}
                        jogo={jogo}
                        resultado={resultado}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                        className="bg-black/40 backdrop-blur-xl border-white/10"
                        onViewConfirmacoes={(id) => {
                          setSelectedJogoId(id);
                          setConfirmDialogOpen(true);
                        }}
                        onStatusChange={handleUpdateStatus}
                        compact
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardContent className="py-6 text-center text-muted-foreground">
                    Nenhum jogo nesta data.
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="py-6 text-center text-muted-foreground">
                  Clique em um dia do calendário para ver os jogos.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialog para gerenciar Presenças */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Presenças</DialogTitle>
          </DialogHeader>
          {selectedJogoId && <AdminPresencaManager jogoId={selectedJogoId} />}
        </DialogContent>
      </Dialog>

      {/* Dialog para Registro/Edição de Resultados */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResult ? "Editar Resultado" : "Registrar Resultado"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResultSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gols_favor">Gols do Time</Label>
                <Input
                  id="gols_favor"
                  type="number"
                  min="0"
                  value={resultFormData.gols_favor}
                  onChange={(e) => setResultFormData({ ...resultFormData, gols_favor: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gols_contra">Gols Adversário</Label>
                <Input
                  id="gols_contra"
                  type="number"
                  min="0"
                  value={resultFormData.gols_contra}
                  onChange={(e) => setResultFormData({ ...resultFormData, gols_contra: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res_observacoes">Observações</Label>
              <Textarea
                id="res_observacoes"
                value={resultFormData.observacoes}
                onChange={(e) => setResultFormData({ ...resultFormData, observacoes: e.target.value })}
                placeholder="Destaques, gols marcados, etc."
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResultDialogOpen(false)} className="h-11 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 sm:h-10">
                {isSubmitting ? "Salvando..." : editingResult ? "Salvar" : "Salvar e Preencher Estatísticas"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Estatísticas */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estatísticas da Partida</DialogTitle>
          </DialogHeader>
          {selectedResultadoId && (
            <EstatisticasPartidaForm
              resultadoId={selectedResultadoId}
              jogoId={jogos?.find(j => resultados?.find(r => r.id === selectedResultadoId)?.jogo_id === j.id)?.id}
              onSave={() => setStatsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}

// Componente separado para o card do jogo com contador de confirmações
function JogoCard({
  jogo,
  resultado,
  onEdit,
  onDelete,
  onViewConfirmacoes,
  onStatusChange,
  onRegisterResult,
  onEditResult,
  onViewStats,
  compact = false,
  className
}: {
  jogo: Jogo;
  resultado?: Resultado;
  onEdit: (jogo: Jogo) => void;
  onDelete: (id: string) => void;
  onViewConfirmacoes: (id: string) => void;
  onStatusChange: (id: string, status: GameStatus) => void;
  onRegisterResult?: (jogo: Jogo) => void;
  onEditResult?: (jogo: Jogo, result: Resultado) => void;
  onViewStats?: (resultId: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const { data: contagem } = useConfirmacoesContagem(jogo.id);
  const { hasPresenca } = usePlanAccess();

  const getResultColor = (golsFavor: number, golsContra: number) => {
    if (golsFavor > golsContra) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (golsFavor < golsContra) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-white/10 text-white border-white/20";
  };

  return (
    <Card className={cn("bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden", resultado ? "border-l-4 border-l-primary" : "", className)}>
      <CardContent className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", compact ? "p-3" : "p-4")}>
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            
            {/* Status Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                 <Badge 
                  variant={jogo.status === "confirmado" ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer hover:opacity-80 uppercase tracking-widest text-[10px] font-black italic",
                    jogo.status === "confirmado" ? "bg-primary text-black" : "bg-white/5 border-white/10 text-white"
                  )}
                 >
                  {statusLabels[jogo.status]}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="start">
                <div className="grid gap-1">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <Button
                      key={value}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start text-xs", 
                        jogo.status === value && "bg-accent"
                      )}
                      onClick={() => onStatusChange(jogo.id, value as GameStatus)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {contagem && contagem.total > 0 && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3 text-green-600" />
                {contagem.confirmados}
                <X className="ml-1 h-3 w-3 text-destructive" />
                {contagem.indisponiveis}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <h3 className={cn("font-black uppercase italic tracking-tight text-white", compact ? "text-sm" : "text-base")}>vs {jogo.adversario}</h3>
            
            {/* Placar em destaque */}
            {resultado && (
              <Badge variant="outline" className={cn("text-base font-bold", getResultColor(resultado.gols_favor, resultado.gols_contra))}>
                {resultado.gols_favor} x {resultado.gols_contra}
              </Badge>
            )}
          </div>

          <div className={cn("mt-1 flex flex-wrap gap-3 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(jogo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(jogo.data_hora), "HH:mm")}
            </span>
            {!compact && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {jogo.local}
              </span>
            )}
          </div>
        </div>
        
        <div className={cn("flex flex-wrap gap-2 items-center", compact && "flex-col items-end")}>
          {hasPresenca && (
            <>
              <Button
                variant="outline"
                size={compact ? "icon" : "sm"}
                onClick={() => onViewConfirmacoes(jogo.id)}
                title="Presenças"
              >
                <Users className={compact ? "h-4 w-4" : "mr-1 h-4 w-4"} />
                {!compact && "Presenças"}
              </Button>
              <PresencaLinkDialog jogoId={jogo.id} adversario={jogo.adversario} />
            </>
          )}

          {/* Botões de Resultado (Apenas se não for compact ou se for compact mas tiver ação necessária) */}
          {!resultado && onRegisterResult && (
             <Button 
              variant="default" 
              size={compact ? "icon" : "sm"}
              onClick={() => onRegisterResult(jogo)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              title="Registrar Resultado"
             >
               <Trophy className={compact ? "h-4 w-4" : "mr-1 h-4 w-4"} />
               {!compact && "Resultado"}
             </Button>
          )}

          {resultado && (
            <>
               {onViewStats && (
                <Button
                  variant="secondary"
                  size={compact ? "icon" : "sm"}
                  onClick={() => onViewStats(resultado.id)}
                  title="Estatísticas"
                >
                  <List className={compact ? "h-4 w-4" : "mr-1 h-4 w-4"} />
                  {!compact && "Stats"}
                </Button>
               )}
               {onEditResult && (
                 <Button
                   variant="ghost" 
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => onEditResult(jogo, resultado)}
                   title="Editar Resultado"
                 >
                   <Edit className="h-4 w-4 text-muted-foreground" />
                 </Button>
               )}
            </>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(jogo)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(jogo.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
