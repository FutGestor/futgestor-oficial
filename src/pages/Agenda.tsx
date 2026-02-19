import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock,
  Plus, Edit, Trash2, Users, Check, X, Trophy, List
} from "lucide-react";
import PresencaLinkDialog from "@/components/PresencaLinkDialog";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJogos, useResultados } from "@/hooks/useData";
import { useTimeCasa, useTimesAtivos } from "@/hooks/useTimes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import {
  statusLabels, tipoJogoLabels, mandoLabels,
  type Jogo, type GameStatus, type Resultado, type TipoJogo, type MandoJogo, type Time
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { usePlanAccess } from "@/hooks/useSubscription";
import { TeamShield } from "@/components/TeamShield";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { TimePickerSelect } from "@/components/ui/time-picker-select";
import AdminPresencaManager from "@/components/AdminPresencaManager";
import EstatisticasPartidaForm from "@/components/EstatisticasPartidaForm";
import { JogoFormComEscalacao } from "@/components/JogoFormComEscalacao";
import { AlertaJogoHoje } from "@/components/AlertaJogoHoje";
import type { GameModality } from "@/lib/types";

// ── Types ──────────────────────────────────────────────
interface EscalacaoFormData {
  criarEscalacao: boolean;
  formacao: string;
  modalidade: GameModality;
  publicada: boolean;
  jogadores_por_posicao: Record<string, string>;
  posicoes_customizadas: Record<string, string>;
  banco: string[];
}

interface JogoFormData {
  data_hora: string;
  local: string;
  adversario: string;
  time_adversario_id: string | null;
  status: GameStatus;
  tipo_jogo: TipoJogo;
  mando: MandoJogo;
  observacoes: string;
}

interface ResultadoFormData {
  jogo_id: string;
  gols_favor: string;
  gols_contra: string;
  observacoes: string;
}

const initialFormData: JogoFormData = {
  data_hora: "",
  local: "",
  adversario: "",
  time_adversario_id: null,
  status: "agendado",
  tipo_jogo: "amistoso",
  mando: "mandante",
  observacoes: "",
};

const initialResultFormData: ResultadoFormData = {
  jogo_id: "",
  gols_favor: "0",
  gols_contra: "0",
  observacoes: "",
};

// ── Read-only GameCard (for non-admin users) ───────────
function ReadOnlyGameCard({ jogo, timeCasa, resultado, team }: { jogo: Jogo; timeCasa?: Time | null; resultado?: Resultado | null, team?: any }) {
  const gameDate = new Date(jogo.data_hora);
  const time = jogo.time_adversario;
  const isFinalizado = jogo.status === 'finalizado' && resultado;
  const golsFavor = resultado?.gols_favor ?? 0;
  const golsContra = resultado?.gols_contra ?? 0;
  const isVitoria = isFinalizado && golsFavor > golsContra;
  const isDerrota = isFinalizado && golsFavor < golsContra;

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10 transition-all hover:scale-[1.01]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={jogo.status === 'confirmado' ? 'default' : jogo.status === 'finalizado' ? 'secondary' : 'outline'}>
                {statusLabels[jogo.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TeamShield 
                  escudoUrl={team?.escudo_url || null} 
                  teamName={team?.nome || 'Meu Time'} 
                  size="sm" 
                />
                <span className="font-semibold">{team?.nome || 'Meu Time'}</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px]">
                {isFinalizado ? (
                  <div className={cn(
                    "px-3 py-1 rounded text-lg font-bold whitespace-nowrap",
                    isVitoria ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    isDerrota ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}>{golsFavor} x {golsContra}</div>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">vs</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TeamShield 
                  escudoUrl={time?.escudo_url || null} 
                  teamName={time?.nome || jogo.adversario} 
                  size="sm" 
                />
                <p className="font-semibold text-xs text-center line-clamp-2 leading-tight max-w-[80px] sm:max-w-none">{time?.nome || jogo.adversario}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{format(gameDate, "dd 'de' MMMM", { locale: ptBR })}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{format(gameDate, "HH:mm")}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{jogo.local}</span>
            </div>
            {jogo.observacoes && <p className="mt-2 text-sm text-muted-foreground">{jogo.observacoes}</p>}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-foreground">{format(gameDate, "dd")}</div>
            <div className="text-sm text-muted-foreground capitalize">{format(gameDate, "MMM", { locale: ptBR })}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Admin JogoCard (with action buttons) ───────────────
function AdminJogoCard({
  jogo, resultado, timeCasa, onEdit, onDelete, onViewConfirmacoes, onStatusChange,
  onRegisterResult, onEditResult, onViewStats
}: {
  jogo: Jogo;
  resultado?: Resultado;
  timeCasa?: any | null;
  onEdit: (jogo: Jogo) => void;
  onDelete: (id: string) => void;
  onViewConfirmacoes: (id: string) => void;
  onStatusChange: (id: string, status: GameStatus) => void;
  onRegisterResult: (jogo: Jogo) => void;
  onEditResult: (jogo: Jogo, result: Resultado) => void;
  onViewStats: (resultId: string) => void;
}) {
  const { data: contagem } = useConfirmacoesContagem(jogo.id);
  const { hasPresenca } = usePlanAccess();
  const { team: teamConfig } = useTeamConfig();

  const getResultColor = (golsFavor: number, golsContra: number) => {
    if (golsFavor > golsContra) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (golsFavor < golsContra) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-white/10 text-white border-white/20";
  };

  return (
    <Card className={cn("bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden", resultado ? "border-l-4 border-l-primary" : "")}>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
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
                    <Button key={value} variant="ghost" size="sm"
                      className={cn("justify-start text-xs", jogo.status === value && "bg-accent")}
                      onClick={() => onStatusChange(jogo.id, value as GameStatus)}
                    >{label}</Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {contagem && contagem.total > 0 && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3 text-green-600" />{contagem.confirmados}
                <X className="ml-1 h-3 w-3 text-destructive" />{contagem.indisponiveis}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TeamShield 
                escudoUrl={teamConfig?.escudo_url || null} 
                teamName={teamConfig?.nome || 'Meu Time'} 
                size="sm" 
              />
              <span className="font-bold uppercase italic tracking-tight text-white/80 text-sm">
                {teamConfig?.nome || 'Meu Time'}
              </span>
            </div>

            <div className="flex flex-col items-center min-w-[40px]">
              {resultado ? (
                <Badge variant="outline" className={cn("text-base font-bold px-2 py-0", getResultColor(resultado.gols_favor, resultado.gols_contra))}>
                  {resultado.gols_favor} x {resultado.gols_contra}
                </Badge>
              ) : (
                <span className="text-[10px] font-black text-white/30 italic mr-1 ml-1">VS</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <TeamShield 
                escudoUrl={jogo.time_adversario?.escudo_url || null} 
                teamName={jogo.time_adversario?.nome || jogo.adversario} 
                size="sm" 
              />
              <span className="font-bold uppercase italic tracking-tight text-white/80 text-sm">
                {jogo.time_adversario?.nome || jogo.adversario}
              </span>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{format(new Date(jogo.data_hora), "dd/MM/yyyy", { locale: ptBR })}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{format(new Date(jogo.data_hora), "HH:mm")}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{jogo.local}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {hasPresenca && (
            <>
              <Button variant="outline" size="sm" onClick={() => onViewConfirmacoes(jogo.id)} title="Presenças">
                <Users className="mr-1 h-4 w-4" />Presenças
              </Button>
              <PresencaLinkDialog jogoId={jogo.id} adversario={jogo.adversario} />
            </>
          )}
          {!resultado && (
            <Button variant="default" size="sm" onClick={() => onRegisterResult(jogo)}
              className="bg-orange-600 hover:bg-orange-700 text-white" title="Registrar Resultado">
              <Trophy className="mr-1 h-4 w-4" />Resultado
            </Button>
          )}
          {resultado && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onViewStats(resultado.id)} title="Estatísticas">
                <List className="mr-1 h-4 w-4" />Stats
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditResult(jogo, resultado)} title="Editar Resultado">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(jogo)} title="Editar Jogo">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(jogo.id)} title="Excluir Jogo">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Agenda Component ──────────────────────────────
function AgendaContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { team, basePath } = useTeamSlug();
  const { isAdmin, profile } = useAuth();
  const { team: teamConfig } = useTeamConfig();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jogos, isLoading } = useJogos(team.id || undefined);
  const { data: resultados } = useResultados(team.id || undefined);
  const { data: timeCasa } = useTimeCasa(team.id || undefined);
  const { data: times } = useTimesAtivos(profile?.team_id);

  // ── Admin state ──
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJogo, setEditingJogo] = useState<Jogo | null>(null);

  // Resetar estado da escalação quando abrir dialog para novo jogo
  useEffect(() => {
    if (isDialogOpen && !editingJogo) {
      setEscalacaoFormData({
        criarEscalacao: true,
        formacao: "2-2-2",
        modalidade: "society-6",
        publicada: false,
        jogadores_por_posicao: {},
        posicoes_customizadas: {},
        banco: [],
      });
    }
  }, [isDialogOpen, editingJogo]);
  const [formData, setFormData] = useState<JogoFormData>(initialFormData);
  const [escalacaoFormData, setEscalacaoFormData] = useState<EscalacaoFormData>({
    criarEscalacao: true,
    formacao: "2-2-2",
    modalidade: "society-6",
    publicada: false,
    jogadores_por_posicao: {},
    posicoes_customizadas: {},
    banco: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<Resultado | null>(null);
  const [resultFormData, setResultFormData] = useState<ResultadoFormData>(initialResultFormData);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJogoId, setSelectedJogoId] = useState<string | null>(null);

  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedResultadoId, setSelectedResultadoId] = useState<string | null>(null);

  // ── Calendar helpers ──
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayGames = (date: Date) => jogos?.filter((jogo) => isSameDay(new Date(jogo.data_hora), date)) || [];

  const jogosDoMes = jogos?.filter((jogo) => isSameMonth(new Date(jogo.data_hora), currentMonth))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()) || [];

  const jogosFiltrados = selectedDate
    ? jogos?.filter(j => isSameDay(new Date(j.data_hora), selectedDate)).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()) || []
    : jogosDoMes;

  // ── Admin handlers ──
  const openCreateDialog = (date?: Date) => {
    setEditingJogo(null);
    setFormData(date
      ? { ...initialFormData, data_hora: `${format(date, "yyyy-MM-dd")}T19:00` }
      : initialFormData
    );
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
      tipo_jogo: (jogo.tipo_jogo as TipoJogo) || "amistoso",
      mando: (jogo.mando as MandoJogo) || "mandante",
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
      setResultFormData({ ...initialResultFormData, jogo_id: jogo.id });
    }
    setIsResultDialogOpen(true);
  };

  const handleTimeChange = (timeId: string) => {
    if (timeId === "manual") {
      setFormData({ ...formData, time_adversario_id: null });
    } else {
      const selectedTime = times?.find(t => t.id === timeId);
      if (selectedTime) {
        setFormData({ ...formData, time_adversario_id: timeId, adversario: selectedTime.nome });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataHoraISO = new Date(formData.data_hora).toISOString();
      if (editingJogo) {
        const { error } = await supabase.from("jogos").update({
          data_hora: dataHoraISO, local: formData.local, adversario: formData.adversario,
          time_adversario_id: formData.time_adversario_id, status: formData.status,
          tipo_jogo: formData.tipo_jogo, mando: formData.mando, observacoes: formData.observacoes || null,
        }).eq("id", editingJogo.id);
        if (error) throw error;
        toast({ title: "Jogo atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("jogos").insert({
          data_hora: dataHoraISO, local: formData.local, adversario: formData.adversario,
          time_adversario_id: formData.time_adversario_id, status: formData.status,
          tipo_jogo: formData.tipo_jogo, mando: formData.mando, observacoes: formData.observacoes || null,
          team_id: profile?.team_id,
        });
        if (error) throw error;
        toast({ title: "Jogo criado com sucesso!" });
        try {
          const dataFormatada = format(new Date(formData.data_hora), "dd/MM 'às' HH:mm", { locale: ptBR });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('notify_team', {
            p_team_id: profile?.team_id, p_tipo: 'jogo_agendado',
            p_titulo: 'Novo jogo agendado!',
            p_mensagem: `${teamConfig?.nome || 'Seu time'} vs ${formData.adversario} - ${dataFormatada}`,
            p_link: `${basePath}/agenda`
          });
        } catch (notifError) {
          console.warn('Falha ao enviar notificação:', notifError);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o jogo" });
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
        const { error } = await supabase.from("resultados").update(data).eq("id", editingResult.id);
        if (error) throw error;
        toast({ title: "Resultado atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("resultados").insert(data);
        if (error) throw error;
        toast({ title: "Resultado registrado com sucesso!" });
        await supabase.from("jogos").update({ status: "finalizado" }).eq("id", resultFormData.jogo_id);
        try {
          const jogoDoResultado = jogos?.find(j => j.id === resultFormData.jogo_id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('notify_team', {
            p_team_id: profile?.team_id, p_tipo: 'resultado',
            p_titulo: 'Resultado registrado!',
            p_mensagem: `${teamConfig?.nome || 'Seu time'} ${resultFormData.gols_favor} x ${resultFormData.gols_contra} ${jogoDoResultado?.adversario || 'Adversário'}`,
            p_link: `${basePath}/resultados`
          });
        } catch (notifError) {
          console.warn('Falha ao enviar notificação:', notifError);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["resultados"] });
      await queryClient.invalidateQueries({ queryKey: ["jogos"] });
      setIsResultDialogOpen(false);

      const { data: newRes } = await supabase.from("resultados").select("id").eq("jogo_id", resultFormData.jogo_id).maybeSingle();
      if (newRes?.id) {
        setSelectedResultadoId(newRes.id);
        setStatsDialogOpen(true);
      }
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro" });
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
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro" });
    }
  };

  const handleUpdateStatus = async (jogoId: string, newStatus: GameStatus) => {
    try {
      const { error } = await supabase.from("jogos").update({ status: newStatus }).eq("id", jogoId);
      if (error) throw error;
      toast({ title: "Status atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
    } catch {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    }
  };

  // ── Render ──
  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        {/* Alerta de jogos hoje - apenas para admins */}
        {isAdmin && <AlertaJogoHoje />}
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Calendário de jogos do time</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2 self-start">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthDays.map((day) => {
                  const dayGames = getDayGames(day);
                  const hasGames = dayGames.length > 0;
                  const isToday = isSameDay(day, new Date());
                  const firstGame = dayGames[0];
                  const time = firstGame?.time_adversario;
                  const escudoUrl = time?.escudo_url || (time as any)?.adversary_team?.escudo_url || null;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)}
                      className={cn(
                        "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                        isToday && !selectedDate && "bg-primary text-primary-foreground",
                        selectedDate && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary",
                        hasGames && !isToday && (!selectedDate || !isSameDay(day, selectedDate)) && "bg-transparent text-card-foreground border hover:bg-transparent/80",
                        !hasGames && !isToday && (!selectedDate || !isSameDay(day, selectedDate)) && "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground"
                      )}
                    >
                       {(!hasGames || !escudoUrl) && (
                        <span className={cn("absolute left-1 top-0.5 text-[10px] font-medium z-10", hasGames && "font-bold")}>
                          {format(day, "d")}
                        </span>
                      )}
                      {hasGames && escudoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          <TeamShield 
                            escudoUrl={escudoUrl} 
                            teamName={time?.nome || firstGame.adversario} 
                            size="sm"
                            className="h-full w-full border-0 shadow-none bg-transparent" 
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Games list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold">
                {selectedDate
                  ? `Jogos em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                  : `Jogos em ${format(currentMonth, "MMMM", { locale: ptBR })}`
                }
              </h2>
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
                    Ver mês inteiro
                  </Button>
                )}
                {isAdmin && selectedDate && (
                  <Button size="sm" className="gap-1" onClick={() => openCreateDialog(selectedDate)}>
                    <Plus className="h-4 w-4" />
                    Adicionar Jogo
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : jogosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {jogosFiltrados.map((jogo) => {
                  const resultado = resultados?.find(r => r.jogo_id === jogo.id);
                  return isAdmin ? (
                    <AdminJogoCard
                      key={jogo.id}
                      jogo={jogo}
                      resultado={resultado}
                      timeCasa={timeCasa}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onViewConfirmacoes={(id) => { setSelectedJogoId(id); setConfirmDialogOpen(true); }}
                      onStatusChange={handleUpdateStatus}
                      onRegisterResult={(jogo) => openResultDialog(jogo)}
                      onEditResult={(jogo, res) => openResultDialog(jogo, res)}
                      onViewStats={(resId) => { setSelectedResultadoId(resId); setStatsDialogOpen(true); }}
                    />
                  ) : (
                    <ReadOnlyGameCard key={jogo.id} jogo={jogo} timeCasa={timeCasa} resultado={resultado} team={team || teamConfig} />
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum jogo agendado para {selectedDate ? "esta data" : "este mês"}.
                  {isAdmin && selectedDate && (
                    <div className="mt-4">
                      <Button onClick={() => openCreateDialog(selectedDate)} className="gap-1">
                        <Plus className="h-4 w-4" />Criar jogo nesta data
                      </Button>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="mt-2">
                      <Button variant="link" onClick={() => setSelectedDate(null)}>Ver jogos do mês</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin Dialogs ── */}
      {isAdmin && (
        <>
          {/* Dialog: Criar/Editar Jogo com Escalação */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>
                  {editingJogo ? "Editar Jogo" : "Novo Jogo com Escalação"}
                </DialogTitle>
                <DialogDescription>
                  {editingJogo 
                    ? "Edite os dados do jogo."
                    : "Crie o jogo e já prepare a escalação. Você poderá finalizar depois."}
                </DialogDescription>
              </DialogHeader>
              
              <JogoFormComEscalacao
                key={isDialogOpen ? "open" : "closed"} // Forçar recriação apenas quando o dialog abre/fecha
                initialJogoData={editingJogo ? {
                  data_hora: editingJogo.data_hora,
                  local: editingJogo.local,
                  adversario: editingJogo.adversario,
                  tipo_jogo: editingJogo.tipo_jogo,
                  mando: editingJogo.mando,
                  observacoes: editingJogo.observacoes || "",
                  time_adversario_id: editingJogo.time_adversario_id,
                } : {
                  data_hora: formData.data_hora,
                  local: formData.local,
                  adversario: formData.adversario,
                  tipo_jogo: formData.tipo_jogo,
                  mando: formData.mando,
                  observacoes: formData.observacoes,
                }}
                jogoId={editingJogo?.id}
                escalacaoData={escalacaoFormData}
                onEscalacaoChange={setEscalacaoFormData}
                onSubmit={async (data) => {
                  setIsSubmitting(true);
                  try {
                    if (editingJogo) {
                      // Atualizar apenas o jogo
                      const { error } = await supabase
                        .from("jogos")
                        .update({
                          data_hora: new Date(data.jogo.data_hora).toISOString(),
                          local: data.jogo.local,
                          adversario: data.jogo.adversario,
                          time_adversario_id: data.jogo.time_adversario_id || null,
                          tipo_jogo: data.jogo.tipo_jogo,
                          mando: data.jogo.mando,
                          observacoes: data.jogo.observacoes || null,
                        })
                        .eq("id", editingJogo.id);

                      if (error) throw error;
                      toast({ title: "Jogo atualizado com sucesso!" });
                    } else {
                      // Criar jogo
                      const { data: novoJogo, error } = await supabase
                        .from("jogos")
                        .insert({
                          team_id: team.id,
                          data_hora: new Date(data.jogo.data_hora).toISOString(),
                          local: data.jogo.local,
                          adversario: data.jogo.adversario,
                          time_adversario_id: data.jogo.time_adversario_id || null,
                          tipo_jogo: data.jogo.tipo_jogo,
                          mando: data.jogo.mando,
                          observacoes: data.jogo.observacoes || null,
                          status: "agendado",
                          tem_escalacao: data.escalacao?.criarEscalacao || false,
                        })
                        .select()
                        .single();

                      if (error) throw error;

                      // Criar escalação se solicitado
                      if (data.escalacao?.criarEscalacao && novoJogo) {
                        // 1. Criar registro na tabela escalacoes (SEM jogadores)
                        const { data: newEscalacao, error: escalacaoError } = await supabase
                          .from("escalacoes")
                          .insert({
                            jogo_id: novoJogo.id,
                            team_id: team.id,
                            formacao: data.escalacao.formacao,
                            modalidade: data.escalacao.modalidade,
                            publicada: data.escalacao.publicada,
                            status_escalacao: data.escalacao.publicada ? "publicada" : "provavel",
                          })
                          .select()
                          .single();

                        if (escalacaoError) throw escalacaoError;

                        // 2. Inserir jogadores na tabela escalacao_jogadores (IGUAL AdminEscalacoes)
                        const jogadoresCampo = Object.entries(data.escalacao.jogadores_por_posicao)
                          .filter(([slot, jogadorId]) => jogadorId)
                          .map(([slot, jogadorId], index) => ({
                            escalacao_id: newEscalacao.id,
                            jogador_id: jogadorId,
                            posicao_campo: data.escalacao.posicoes_customizadas?.[jogadorId] || slot,
                            ordem: index,
                          }));

                        const jogadoresBanco = (data.escalacao.banco || []).map((jogadorId, index) => ({
                          escalacao_id: newEscalacao.id,
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

                        toast({ 
                          title: "Jogo e escalação criados!",
                          description: data.escalacao.publicada 
                            ? "Escalação publicada." 
                            : "Escalação provável criada. Finalize após confirmações."
                        });
                      } else {
                        toast({ title: "Jogo criado com sucesso!" });
                      }
                    }

                    queryClient.invalidateQueries({ queryKey: ["jogos"] });
                    queryClient.invalidateQueries({ queryKey: ["escalacoes"] });
                    setIsDialogOpen(false);
                    setEditingJogo(null);
                    setFormData(initialFormData);
                  } catch (err: any) {
                    toast({ 
                      variant: "destructive", 
                      title: "Erro", 
                      description: err.message 
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingJogo(null);
                }}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>

          {/* Dialog: Presenças */}
          <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <DialogContent className="max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Gerenciar Presenças</DialogTitle>
                <DialogDescription>
                  Confirme a presença dos jogadores para este jogo.
                </DialogDescription>
              </DialogHeader>
              {selectedJogoId && <AdminPresencaManager jogoId={selectedJogoId} />}
            </DialogContent>
          </Dialog>

          {/* Dialog: Resultado */}
          <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
            <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingResult ? "Editar Resultado" : "Registrar Resultado"}</DialogTitle>
                <DialogDescription>
                  Registre o placar final da partida.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResultSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gols_favor">Gols do Time</Label>
                    <Input id="gols_favor" type="number" min="0" value={resultFormData.gols_favor}
                      onChange={(e) => setResultFormData({ ...resultFormData, gols_favor: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gols_contra">Gols Adversário</Label>
                    <Input id="gols_contra" type="number" min="0" value={resultFormData.gols_contra}
                      onChange={(e) => setResultFormData({ ...resultFormData, gols_contra: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="res_observacoes">Observações</Label>
                  <Textarea id="res_observacoes" value={resultFormData.observacoes}
                    onChange={(e) => setResultFormData({ ...resultFormData, observacoes: e.target.value })}
                    placeholder="Destaques, gols marcados, etc." />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsResultDialogOpen(false)} className="h-11 sm:h-10">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="h-11 sm:h-10">
                    {isSubmitting ? "Salvando..." : editingResult ? "Salvar" : "Salvar e Preencher Estatísticas"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: Estatísticas */}
          <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
            <DialogContent className="max-w-2xl" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Estatísticas da Partida</DialogTitle>
                <DialogDescription>
                  Registre as estatísticas individuais dos jogadores.
                </DialogDescription>
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
        </>
      )}
    </Layout>
  );
}

export default function AgendaPage() {
  return <AgendaContent />;
}
