import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trophy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useLeagues, useCreateLeague, useDeleteLeague } from "@/hooks/useLeagues";

export default function AdminCampeonatos() {
  const { basePath } = useTeamSlug();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: leagues, isLoading } = useLeagues();
  const createLeague = useCreateLeague();
  const deleteLeague = useDeleteLeague();
  const [name, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const league = await createLeague.mutateAsync(name.trim());
      toast({ title: "Campeonato criado!" });
      setName("");
      setDialogOpen(false);
      navigate(`${basePath}/ligas/gerenciar/${league.id}`);
    } catch {
      toast({ variant: "destructive", title: "Erro ao criar campeonato" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLeague.mutateAsync(id);
      toast({ title: "Campeonato excluído" });
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <ManagementHeader 
        title="Gerenciar Ligas" 
        subtitle="Crie campeonatos, adicione times e acompanhe a tabela." 
      />

      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Criar Campeonato</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Campeonato</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Ex: Copa Indaiatuba 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate} disabled={!name.trim() || createLeague.isPending}>
                {createLeague.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {leagues && leagues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum campeonato criado ainda.</p>
            <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Criar seu primeiro campeonato
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leagues?.map((league) => (
          <Card
            key={league.id}
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate(`${basePath}/ligas/gerenciar/${league.id}`)}
          >
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-foreground" />
                {league.name}
              </CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir campeonato?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os times e jogos deste campeonato serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(league.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
