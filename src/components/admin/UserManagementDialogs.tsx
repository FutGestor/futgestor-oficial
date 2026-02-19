import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileWithEmail {
  id: string;
  nome: string | null;
  teamName?: string;
}

interface UserManagementDialogsProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  userToDelete: ProfileWithEmail | null;
  isDeleting: boolean;
  handleDeleteComplete: () => void;
  
  editNameDialogOpen: boolean;
  setEditNameDialogOpen: (open: boolean) => void;
  userToEditName: ProfileWithEmail | null;
  newName: string;
  setNewName: (name: string) => void;
  handleUpdateName: () => void;
  isUpdating: string | null;

  planDialogOpen: boolean;
  setPlanDialogOpen: (open: boolean) => void;
  userToUpdatePlan: ProfileWithEmail | null;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  handleUpdatePlan: () => void;
}

export function UserManagementDialogs({
  deleteDialogOpen, setDeleteDialogOpen, userToDelete, isDeleting, handleDeleteComplete,
  editNameDialogOpen, setEditNameDialogOpen, userToEditName, newName, setNewName, handleUpdateName, isUpdating,
  planDialogOpen, setPlanDialogOpen, userToUpdatePlan, selectedPlan, setSelectedPlan, handleUpdatePlan
}: UserManagementDialogsProps) {
  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão Permanente</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir permanentemente o usuário{" "}
              <strong>{userToDelete?.nome || "Sem nome"}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. O usuário será removido completamente
              do sistema e poderá se cadastrar novamente com o mesmo email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComplete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editNameDialogOpen} onOpenChange={setEditNameDialogOpen}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Definir Nome do Usuário</DialogTitle>
            <DialogDescription>
              Digite o nome completo para este usuário.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome completo"
            className="mt-2"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditNameDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateName}
              disabled={!newName.trim() || isUpdating === userToEditName?.id}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Mudar Plano do Time</DialogTitle>
            <DialogDescription>
              Escolha o novo plano para o time <strong>{userToUpdatePlan?.teamName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (Gratuito)</SelectItem>
                <SelectItem value="pro">Pro (Intermediário)</SelectItem>
                <SelectItem value="liga">Liga (Completo)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Isso vai alterar a assinatura imediatamente e definir validade de 100 anos.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPlanDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePlan}
              disabled={!selectedPlan || isUpdating === userToUpdatePlan?.id}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Atualizar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
