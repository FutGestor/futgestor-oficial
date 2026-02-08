import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Users, Check, X, Shield, List, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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
import { useJogos } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useTimesAtivos } from "@/hooks/useTimes";
import { useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import { statusLabels, type Jogo, type GameStatus } from "@/lib/types";
import AdminPresencaManager from "@/components/AdminPresencaManager";
import { cn } from "@/lib/utils";

type JogoFormData = {
  data_hora: string;
  local: string;
  adversario: string;
  time_adversario_id: string | null;
  status: GameStatus;
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

export default function AdminJogos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJogoId, setSelectedJogoId] = useState<string | null>(null);
  const [editingJogo, setEditingJogo] = useState<Jogo | null>(null);
  const [formData, setFormData] = useState<JogoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para visualização de calendário
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { data: jogos, isLoading } = useJogos();
  const { profile } = useAuth();
  const { data: times } = useTimesAtivos(profile?.team_id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Funções auxiliares para o calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayGames = (date: Date) => {
    return jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];
  };

  const jogosDoDia = selectedDate ? getDayGames(selectedDate) : [];

  // Filtrar jogos finalizados e ordenar (apenas para modo lista)
  const jogosSorted = [...(jogos || [])]
    .filter((jogo) => jogo.status !== "finalizado")
    .sort((a, b) => {
      const dateA = new Date(a.data_hora).getTime();
      const dateB = new Date(b.data_hora).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const openCreateDialog = () => {
    setEditingJogo(null);
    setFormData(initialFormData);
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
      // Converter data_hora local para ISO string (UTC)
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

  const handleDayClick = (day: Date) => {
    setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Linha 1: Título + Botão Novo Jogo */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Jogos</h2>
            <p className="text-muted-foreground">Gerencie a agenda de jogos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="sm" className="shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Novo Jogo</span>
                <span className="sm:hidden">Novo</span>
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
                            {time.escudo_url ? (
                              <img src={time.escudo_url} alt="" className="h-5 w-5 rounded-full object-contain" />
                            ) : (
                              <Shield className="h-4 w-4 text-muted-foreground" />
                            )}
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
                <div className="space-y-2">
                  <Label htmlFor="data_hora">Data e Hora</Label>
                  <Input
                    id="data_hora"
                    type="datetime-local"
                    value={formData.data_hora}
                    onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                    required
                  />
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
          
          {viewMode === "list" && (
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Próximos</SelectItem>
                <SelectItem value="desc">Mais distantes</SelectItem>
              </SelectContent>
            </Select>
          )}
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
            {jogosSorted.map((jogo) => (
              <JogoCard 
                key={jogo.id} 
                jogo={jogo} 
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onViewConfirmacoes={(id) => {
                  setSelectedJogoId(id);
                  setConfirmDialogOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum jogo cadastrado.
            </CardContent>
          </Card>
        )
      ) : (
        // Modo Calendário
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendário */}
          <Card className="lg:col-span-2">
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
                        hasGames && !isToday && !isSelected && "bg-card text-card-foreground border",
                        !hasGames && !isToday && "bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      {/* Número do dia - escondido se tiver escudo */}
                      {(!hasGames || !time?.escudo_url) && (
                        <span className={cn(
                          "absolute left-1 top-0.5 text-[10px] font-medium z-10",
                          hasGames && "font-bold"
                        )}>
                          {format(day, "d")}
                        </span>
                      )}
                      
                      {/* Escudo ocupando todo o quadrado */}
                      {hasGames && time?.escudo_url && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          <img 
                            src={time.escudo_url} 
                            alt={time.nome || firstGame.adversario}
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
            <h3 className="text-lg font-semibold">
              {selectedDate 
                ? `Jogos em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
                : "Selecione um dia"
              }
            </h3>
            
            {selectedDate ? (
              jogosDoDia.length > 0 ? (
                <div className="space-y-4">
                  {jogosDoDia.map((jogo) => (
                    <JogoCard 
                      key={jogo.id} 
                      jogo={jogo} 
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onViewConfirmacoes={(id) => {
                        setSelectedJogoId(id);
                        setConfirmDialogOpen(true);
                      }}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    Nenhum jogo nesta data.
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
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
    </div>
  );
}

// Componente separado para o card do jogo com contador de confirmações
function JogoCard({ 
  jogo, 
  onEdit, 
  onDelete, 
  onViewConfirmacoes,
  compact = false
}: { 
  jogo: Jogo; 
  onEdit: (jogo: Jogo) => void; 
  onDelete: (id: string) => void; 
  onViewConfirmacoes: (id: string) => void;
  compact?: boolean;
}) {
  const { data: contagem } = useConfirmacoesContagem(jogo.id);
  
  return (
    <Card>
      <CardContent className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", compact ? "p-3" : "p-4")}>
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={jogo.status === "confirmado" ? "default" : "secondary"}>
              {statusLabels[jogo.status]}
            </Badge>
            {contagem && contagem.total > 0 && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3 text-green-600" />
                {contagem.confirmados}
                <X className="ml-1 h-3 w-3 text-destructive" />
                {contagem.indisponiveis}
              </Badge>
            )}
          </div>
          <h3 className={cn("font-semibold", compact && "text-sm")}>vs {jogo.adversario}</h3>
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
        <div className={cn("flex flex-wrap gap-2", compact && "flex-col")}>
          <Button 
            variant="outline" 
            size={compact ? "icon" : "sm"}
            onClick={() => onViewConfirmacoes(jogo.id)}
          >
            <Users className={compact ? "h-4 w-4" : "mr-1 h-4 w-4"} />
            {!compact && "Presenças"}
          </Button>
          <PresencaLinkDialog jogoId={jogo.id} adversario={jogo.adversario} />
          <Button variant="outline" size="icon" onClick={() => onEdit(jogo)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => onDelete(jogo.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
