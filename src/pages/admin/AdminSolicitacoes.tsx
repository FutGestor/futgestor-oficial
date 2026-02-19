import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Check,
  X,
  Trash2,
  Loader2,
  Sword,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSolicitacoes,
  useUpdateSolicitacaoStatus,
  useDeleteSolicitacao,
  RequestStatus,
  SolicitacaoJogo,
} from "@/hooks/useSolicitacoes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { TimePickerSelect } from "@/components/ui/time-picker-select";

const statusLabels: Record<RequestStatus, string> = {
  pendente: "Pendente",
  aceita: "Aceita",
  recusada: "Recusada",
};

const statusColors: Record<RequestStatus, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400",
  aceita: "bg-green-500/20 text-green-400",
  recusada: "bg-red-500/20 text-red-400",
};

import { useTeamConfig } from "@/hooks/useTeamConfig";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Layout } from "@/components/layout/Layout";
import { TeamShield } from "@/components/TeamShield";
import { MessageCircle } from "lucide-react";
export default function AdminSolicitacoes() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoJogo | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);
  const [gameData, setGameData] = useState({
    local: "",
    dataHora: "",
  });

  const { team } = useTeamConfig();
  const { basePath, slug } = useTeamSlug();
  const { data: solicitacoes, isLoading } = useSolicitacoes(
    statusFilter === "all" ? undefined : statusFilter,
    team.id
  );
  const updateStatus = useUpdateSolicitacaoStatus();
  const deleteSolicitacao = useDeleteSolicitacao();
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const handleAccept = (solicitacao: SolicitacaoJogo) => {
    setSelectedSolicitacao(solicitacao);
    setGameData({
      local: solicitacao.local_sugerido,
      dataHora: `${solicitacao.data_preferida}T${solicitacao.horario_preferido}`,
    });
    setAcceptDialogOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedSolicitacao || !profile?.team_id) return;

    setCreatingGame(true);
    try {
      const { error } = await supabase.rpc("accept_game_invite", {
        p_solicitacao_id: selectedSolicitacao.id,
        p_data_hora: gameData.dataHora,
        p_local: gameData.local,
      });

      if (error) throw error;

      toast({
        title: "Jogo criado e sincronizado!",
        description: `Partida confirmada. O calendário de ambos os times foi atualizado com dados oficiais.`,
      });

      queryClient.invalidateQueries({ queryKey: ["jogos"] });
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] }); // Also invalidate solicitacoes list
      setAcceptDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Erro ao aceitar convite:", err);
      toast({
        title: "Erro ao criar jogo",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreatingGame(false);
    }
  };

  const handleReject = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: "recusada" });
    toast({
      title: "Solicitação recusada",
    });
  };

  const handleDelete = (solicitacao: SolicitacaoJogo) => {
    setSelectedSolicitacao(solicitacao);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSolicitacao) {
      await deleteSolicitacao.mutateAsync(selectedSolicitacao.id);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
      <ManagementHeader 
        title="Solicitações de Jogos" 
        subtitle="Gerencie convites de outros times para partidas." 
      />

      {/* Link de Desafio Público Rapid Access */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sword className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase italic">Link de Desafio do Time</p>
              <p className="text-xs text-muted-foreground">Compartilhe para receber novos convites.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:max-w-[250px] bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono truncate">
              {window.location.origin}/time/{slug}/desafio
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10 h-8"
              onClick={() => {
                const url = `${window.location.origin}/time/${slug}/desafio`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "Link Copiado!",
                  description: "Envie para seus adversários.",
                });
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as RequestStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aceita">Aceitas</SelectItem>
            <SelectItem value="recusada">Recusadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {solicitacoes && solicitacoes.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma solicitação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {solicitacoes?.map((sol) => (
            <Card key={sol.id} className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden transition-all hover:bg-black/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <TeamShield 
                      escudoUrl={sol.time_solicitante?.escudo_url || null} 
                      teamName={sol.time_solicitante?.nome || sol.nome_time} 
                      size="sm" 
                    />
                    <CardTitle className="text-base font-black uppercase italic tracking-tight text-white">
                      {sol.time_solicitante?.nome || sol.nome_time}
                    </CardTitle>
                  </div>
                  <Badge className={cn("uppercase tracking-widest text-[10px] font-black italic border-none", statusColors[sol.status])}>
                    {statusLabels[sol.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recebida em {format(new Date(sol.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(sol.data_preferida + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{sol.horario_preferido}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{sol.local_sugerido}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{sol.email_contato}</span>
                  </div>
                  {sol.telefone_contato && (
                    <div className="flex items-center gap-2">
                       <a 
                        href={`https://wa.me/${sol.telefone_contato.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors bg-green-900/20 px-2 py-1 rounded-md"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-bold">WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>

                {sol.observacoes && (
                  <p className="rounded-md bg-black/20 p-2 text-sm">
                    {sol.observacoes}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  {sol.status === "pendente" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(sol)}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(sol.id)}
                        disabled={updateStatus.isPending}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Recusar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => handleDelete(sol)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A solicitação de{" "}
              <strong>{selectedSolicitacao?.nome_time}</strong> será removida
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Dialog - Create Game */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar e Criar Jogo</DialogTitle>
            <DialogDescription>
              Confirme os detalhes do jogo contra{" "}
              <strong>{selectedSolicitacao?.nome_time}</strong>. Você pode
              ajustar a data, horário e local se necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <DatePickerPopover
                  date={gameData.dataHora ? new Date(gameData.dataHora) : undefined}
                  setDate={(date) => {
                    if (date) {
                      const currentTime = gameData.dataHora ? gameData.dataHora.split('T')[1] : "19:00";
                      setGameData((prev) => ({
                        ...prev,
                        dataHora: `${format(date, "yyyy-MM-dd")}T${currentTime}`,
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <TimePickerSelect
                  value={gameData.dataHora ? gameData.dataHora.split('T')[1] : undefined}
                  onChange={(time) => {
                    const currentDate = gameData.dataHora ? gameData.dataHora.split('T')[0] : format(new Date(), "yyyy-MM-dd");
                    setGameData((prev) => ({
                      ...prev,
                      dataHora: `${currentDate}T${time}`,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={gameData.local}
                onChange={(e) =>
                  setGameData((prev) => ({ ...prev, local: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmAccept} disabled={creatingGame}>
              {creatingGame ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Jogo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
