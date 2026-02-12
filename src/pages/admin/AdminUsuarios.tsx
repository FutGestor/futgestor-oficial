import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, UserCheck, UserX, Shield, ShieldOff, Trash2, Pencil, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileWithEmail {
  id: string;
  nome: string | null;
  jogador_id: string | null;
  aprovado: boolean;
  created_at: string;
  team_id: string | null;
  email: string | null;
  plano: string | null;
  status_plano: string | null;
  jogador?: {
    nome: string;
    apelido: string | null;
  } | null;
  isAdmin?: boolean;
  teamName?: string;
}

export default function AdminUsuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile: authProfile, isSuperAdmin } = useAuth();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ProfileWithEmail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para dialog de editar nome
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [userToEditName, setUserToEditName] = useState<ProfileWithEmail | null>(null);
  const [newName, setNewName] = useState("");

  // Estado para dialog de alterar plano
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [userToUpdatePlan, setUserToUpdatePlan] = useState<ProfileWithEmail | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  // Buscar profiles com dados relacionados
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles", authProfile?.team_id, isSuperAdmin],
    queryFn: async () => {
      // Usar NOVA RPC segura para buscar dados com email e plano
      const { data: profilesData, error: profilesError } = await supabase
        .rpc("get_admin_users_full" as any);

      if (profilesError) {
        console.error("RPC Error:", profilesError);
        throw profilesError;
      }

      // Buscar info adicional de jogadores
      const jogadorIds = (profilesData || []).filter(p => p.jogador_id).map(p => p.jogador_id);
      let jogadoresMap: Record<string, { nome: string, apelido: string | null }> = {};

      if (jogadorIds.length > 0) {
        const { data: jogadoresData } = await supabase
          .from("jogadores")
          .select("id, nome, apelido")
          .in("id", jogadorIds);

        if (jogadoresData) {
          jogadoresData.forEach(j => {
            jogadoresMap[j.id] = { nome: j.nome, apelido: j.apelido };
          });
        }
      }

      // Buscar roles de admin
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin"]);

      if (rolesError) throw rolesError;

      // Buscar nomes dos times separadamente
      const teamIds = [...new Set((profilesData || []).map(p => p.team_id).filter(Boolean))] as string[];
      let teamNamesMap: Record<string, string> = {};
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, nome")
          .in("id", teamIds);
        if (teamsData) {
          teamsData.forEach(t => { teamNamesMap[t.id] = t.nome; });
        }
      }

      const adminIds = new Set(rolesData?.filter(r => r.role === 'admin').map(r => r.user_id) || []);
      const superAdminIds = new Set(rolesData?.filter(r => r.role === 'super_admin').map(r => r.user_id) || []);

      // Retornar dados enriquecidos
      return (profilesData || [])
        .map(p => ({
          ...p,
          isAdmin: adminIds.has(p.id),
          teamName: p.team_id ? teamNamesMap[p.team_id] : undefined,
          jogador: p.jogador_id ? jogadoresMap[p.jogador_id] : null
        })) as ProfileWithEmail[];
    },
  });

  const handleApprove = async (profileId: string) => {
    setIsUpdating(profileId);
    try {
      // Get admin's team_id to assign to the approved user
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user!.id)
        .single();

      if (!adminProfile?.team_id) throw new Error("Admin sem time vinculado");

      const { error } = await supabase
        .from("profiles")
        .update({ aprovado: true, team_id: adminProfile.team_id })
        .eq("id", profileId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Usuário aprovado e vinculado ao time!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setIsUpdating(profileId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ aprovado: false })
        .eq("id", profileId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Acesso do usuário revogado!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao revogar acesso",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleAdmin = async (profileId: string, currentlyAdmin: boolean) => {
    setIsUpdating(profileId);
    try {
      if (currentlyAdmin) {
        // Remover role de admin
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", profileId)
          .eq("role", "admin");

        if (error) throw error;
        toast({ title: "Permissão de admin removida!" });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: profileId, role: "admin", team_id: authProfile?.team_id });

        if (error) throw error;
        toast({ title: "Usuário promovido a admin!" });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar permissões",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteComplete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      // Usar NOVA RPC de segurança em vez de Edge Function (evita erro de CORS)
      const { error } = await supabase.rpc("admin_delete_user" as any, {
        _user_id: userToDelete.id
      });

      if (error) {
        throw new Error(error.message || "Erro ao excluir usuário no banco de dados");
      }

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Usuário excluído permanentemente!" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!userToEditName || !newName.trim()) return;

    setIsUpdating(userToEditName.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome: newName.trim() })
        .eq("id", userToEditName.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Nome atualizado com sucesso!" });
      setEditNameDialogOpen(false);
      setUserToEditName(null);
      setNewName("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar nome",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdatePlan = async () => {
    if (!userToUpdatePlan || !selectedPlan || !userToUpdatePlan.team_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um plano e certifique-se que o usuário tem um time.",
      });
      return;
    }

    setIsUpdating(userToUpdatePlan.id);
    try {
      const { error } = await supabase
        .rpc("admin_set_plan", {
          _team_id: userToUpdatePlan.team_id,
          _plan_type: selectedPlan
        });

      if (error) throw error;

      toast({
        title: "Plano atualizado com sucesso!",
        description: `O time agora é ${selectedPlan.toUpperCase()}.`
      });
      setPlanDialogOpen(false);
      setUserToUpdatePlan(null);
      setSelectedPlan("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar plano",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUpdating(null);
    }
  };


  const pendentes = profiles?.filter(p => !p.aprovado) || [];
  const aprovados = profiles?.filter(p => p.aprovado) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Usuários</h2>
          <p className="text-muted-foreground">Gerencie usuários e aprovações</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usuários</h2>
        <p className="text-muted-foreground">Gerencie usuários e aprovações</p>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {pendentes.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprovados" className="gap-2">
            <Check className="h-4 w-4" />
            Aprovados ({aprovados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <UserCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Nenhum usuário pendente de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map(profile => (
                <Card key={profile.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      </div>
                      <p className="mt-1 font-medium">
                        {profile.nome || "Sem nome"}
                      </p>
                      {profile.email && (
                        <p className="text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-muted-foreground">
                        Time: {profile.teamName || "Sem time"}
                      </p>
                      {profile.plano && (
                        <Badge variant="outline" className={`mt-1 ${profile.status_plano === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                          Plano {profile.plano.toUpperCase()} • {profile.status_plano === 'active' ? 'Ativo' : 'Pendente'}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {profile.id.slice(0, 8)}... • Cadastrado em {format(new Date(profile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!profile.nome && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUserToEditName(profile);
                            setNewName("");
                            setEditNameDialogOpen(true);
                          }}
                          disabled={isUpdating === profile.id}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Definir nome
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleApprove(profile.id)}
                        disabled={isUpdating === profile.id}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aprovados" className="mt-4">
          {aprovados.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <UserX className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Nenhum usuário aprovado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {aprovados.map(profile => (
                <Card key={profile.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Aprovado
                        </Badge>
                        {profile.isAdmin && (
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 font-medium">
                        {profile.nome || profile.jogador?.apelido || profile.jogador?.nome || "Sem nome"}
                      </p>
                      {profile.email && (
                        <p className="text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-muted-foreground">
                        Time: {profile.teamName || "Sem time"}
                      </p>
                      {profile.plano && (
                        <Badge variant="outline" className={`mt-1 ${profile.status_plano === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                          Plano {profile.plano.toUpperCase()} • {profile.status_plano === 'active' ? 'Ativo' : 'Pendente'}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {profile.id.slice(0, 8)}... • Desde {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">

                      {/* Botão de Gerenciar Plano (APENAS Super Admin) */}
                      {profile.team_id && isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                          onClick={() => {
                            setUserToUpdatePlan(profile);
                            setSelectedPlan("");
                            setPlanDialogOpen(true);
                          }}
                        >
                          <CreditCard className="mr-1 h-4 w-4" />
                          Plano
                        </Button>
                      )}

                      {!profile.nome && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUserToEditName(profile);
                            setNewName("");
                            setEditNameDialogOpen(true);
                          }}
                          disabled={isUpdating === profile.id}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Nome
                        </Button>
                      )}

                      {/* Botões Administrativos (APENAS Super Admin) */}
                      {isSuperAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAdmin(profile.id, !!profile.isAdmin)}
                            disabled={isUpdating === profile.id}
                            title={profile.isAdmin ? "Remover Admin" : "Tornar Admin"}
                          >
                            {profile.isAdmin ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(profile.id)}
                            disabled={isUpdating === profile.id}
                            title="Rejeitar/Remover Acesso"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setUserToDelete(profile);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={isUpdating === profile.id}
                            title="Excluir Permanentemente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
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
        <DialogContent>
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
                setUserToEditName(null);
                setNewName("");
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

      {/* Dialog de Alterar Plano */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
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
                setUserToUpdatePlan(null);
                setSelectedPlan("");
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
    </div>
  );
}
