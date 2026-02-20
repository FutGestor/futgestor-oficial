import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteTeam } from "@/hooks/useDeleteTeam";
import { useTeamConfig } from "@/hooks/useTeamConfig";

/**
 * Dialog de confirmação para exclusão permanente do time
 * Requer digitar o nome do time para confirmar
 */
export function DeleteTeamDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { team } = useTeamConfig();
  const deleteTeam = useDeleteTeam();

  const teamName = team?.nome || "";
  const teamId = team?.id;
  const isConfirmed = confirmText === teamName;

  const handleDelete = () => {
    if (!teamId || !isConfirmed) return;
    deleteTeam.mutate(teamId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Excluir Time
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-black/90 border-red-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Excluir Time Permanentemente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Esta ação não pode ser desfeita. Todos os dados do time serão
            permanentemente removidos do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
            <p className="text-sm text-red-400 font-medium">
              Os seguintes dados serão excluídos:
            </p>
            <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
              <li>Todos os jogadores e estatísticas</li>
              <li>Jogos, resultados e escalações</li>
              <li>Campeonatos e classificações</li>
              <li>Mensagens do chat e avisos</li>
              <li>Dados financeiros</li>
              <li>Histórico de conquistas</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Digite <strong className="text-white">{teamName}</strong> para
              confirmar:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={teamName}
              className="bg-black/50 border-white/10"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteTeam.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleteTeam.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteTeam.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Sim, excluir permanentemente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
