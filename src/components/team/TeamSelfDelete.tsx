import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface TeamSelfDeleteProps {
  teamId: string;
  teamName: string;
}

export function TeamSelfDelete({ teamId, teamName }: TeamSelfDeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_own_team", {
        _team_id: teamId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast({
        title: "Time excluído com sucesso",
        description: "Todos os dados foram removidos permanentemente.",
      });
      queryClient.clear();
      // Fazer logout e redirecionar para auth
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir time",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirmText !== teamName) {
      toast({
        title: "Confirmação incorreta",
        description: "Digite o nome exato do time para confirmar.",
        variant: "destructive",
      });
      return;
    }
    deleteTeamMutation.mutate();
  };

  const isGodAdmin = user?.email === "futgestor@gmail.com";

  // God Admin não pode se auto-excluir
  if (isGodAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Time Permanentemente
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-red-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Excluir Time Permanentemente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Esta ação não pode ser desfeita. Todos os dados do time serão
            permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
            <p className="text-red-300 font-medium mb-2">
              Você está prestes a excluir:
            </p>
            <p className="text-white font-bold text-lg">{teamName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Para confirmar, digite o nome do time:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={teamName}
              className="bg-black/50 border-white/10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={
              confirmText !== teamName || deleteTeamMutation.isPending
            }
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteTeamMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Exclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
