import { useState } from "react";
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
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  aceita: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  recusada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

import { useTeamConfig } from "@/hooks/useTeamConfig";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";

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
  const { basePath } = useTeamSlug();
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
    if (!selectedSolicitacao) return;

    setCreatingGame(true);
    try {
      // Create the game
      const { error: gameError } = await supabase.from("jogos").insert({
        adversario: selectedSolicitacao.nome_time,
        data_hora: gameData.dataHora,
        local: gameData.local,
        status: "agendado",
        observacoes: selectedSolicitacao.observacoes || null,
        team_id: profile?.team_id,
      });

      if (gameError) throw gameError;

      // Update request status
      await updateStatus.mutateAsync({
        id: selectedSolicitacao.id,
        status: "aceita",
      });

      toast({
        title: "Jogo criado!",
        description: `Partida contra ${selectedSolicitacao.nome_time} foi adicionada à agenda.`,
      });

      queryClient.invalidateQueries({ queryKey: ["jogos"] });
      setAcceptDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar jogo",
        description: error.message,
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
    <div className="space-y-6">
      <ManagementHeader 
        title="Solicitações de Jogos" 
        subtitle="Gerencie convites de outros times para partidas." 
      />

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
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma solicitação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {solicitacoes?.map((sol) => (
            <Card key={sol.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{sol.nome_time}</CardTitle>
                  <Badge className={statusColors[sol.status]}>
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
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{sol.telefone_contato}</span>
                    </div>
                  )}
                </div>

                {sol.observacoes && (
                  <p className="rounded-md bg-muted p-2 text-sm">
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
  );
}
