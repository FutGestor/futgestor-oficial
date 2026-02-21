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

interface PlayerSelfDeleteProps {
  playerName: string;
}

export function PlayerSelfDelete({ playerName }: PlayerSelfDeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuario nao autenticado");
      
      // Chamar a funcao RPC para deletar o proprio usuario
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast({
        title: "Conta excluida com sucesso",
        description: "Todos os seus dados foram removidos permanentemente.",
      });
      queryClient.clear();
      // Fazer logout e redirecionar para auth
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirmText !== playerName) {
      toast({
        title: "Confirmacao incorreta",
        description: "Digite seu nome exato para confirmar.",
        variant: "destructive",
      });
      return;
    }
    deleteAccountMutation.mutate();
  };

  const isGodAdmin = user?.email === "futgestor@gmail.com";
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  // God Admin e Admins de time nao podem se auto-excluir (devem usar o painel God)
  if (isGodAdmin || isAdmin) {
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
          Excluir Minha Conta Permanentemente
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-red-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Excluir Conta Permanentemente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Esta acao nao pode ser desfeita. Todos os seus dados (perfil, estatisticas, presencas) serao permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
            <p className="text-red-300 font-medium mb-2">
              Voce esta prestes a excluir sua conta:
            </p>
            <p className="text-white font-bold text-lg">{playerName}</p>
            <p className="text-muted-foreground text-xs mt-2">
              Email: {user?.email}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Para confirmar, digite seu nome completo:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={playerName}
              className="bg-black/50 border-white/10"
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
            <p className="font-medium">⚠️ Atencao:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
              <li>Seu perfil sera removido do time</li>
              <li>Suas estatisticas serao perdidas</li>
              <li>Voce nao podera recuperar esta conta</li>
            </ul>
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
              confirmText !== playerName || deleteAccountMutation.isPending
            }
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteAccountMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Exclusao
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
