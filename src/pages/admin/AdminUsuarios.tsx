import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ptBR } from "date-fns/locale";
import { UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { UserCard } from "@/components/admin/UserCard";
import { UserManagementDialogs } from "@/components/admin/UserManagementDialogs";

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
      const { data: profilesData, error: profilesError } = await supabase
        .rpc("get_admin_users_full");

      if (profilesError) throw profilesError;

      const jogadorIds = (profilesData || []).filter(p => p.jogador_id).map(p => p.jogador_id);
      const jogadoresMap: Record<string, { nome: string, apelido: string | null }> = {};

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

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin"]);

      if (rolesError) throw rolesError;

      const teamIds = [...new Set((profilesData || []).map(p => p.team_id).filter(Boolean))] as string[];
      const teamNamesMap: Record<string, string> = {};
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
      const { error } = await supabase.rpc("admin_delete_user", { _user_id: userToDelete.id });
      if (error) throw new Error(error.message || "Erro ao excluir usuário");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Usuário excluído permanentemente!" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro desconhecido" });
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
      toast({ title: "Nome atualizado!" });
      setEditNameDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar nome" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdatePlan = async () => {
    if (!userToUpdatePlan?.team_id || !selectedPlan) return;
    setIsUpdating(userToUpdatePlan.id);
    try {
      const { error } = await supabase.rpc("admin_set_plan", {
        _team_id: userToUpdatePlan.team_id,
        _plan_type: selectedPlan
      });
      if (error) throw error;
      toast({ title: "Plano atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      setPlanDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar plano" });
    } finally {
      setIsUpdating(null);
    }
  };

  const pendentes = profiles?.filter(p => !p.aprovado) || [];
  const aprovados = profiles?.filter(p => p.aprovado) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ManagementHeader 
        title="Gestão de Membros" 
        subtitle="Controle quem tem acesso ao time e defina administradores." 
      />

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" /> Pendentes
            {pendentes.length > 0 && <Badge variant="destructive" className="ml-1">{pendentes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="aprovados" className="gap-2">
            <UserCheck className="h-4 w-4" /> Aprovados ({aprovados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4 space-y-3">
          {pendentes.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="py-16 text-center text-muted-foreground">
                <UserCheck className="mx-auto mb-6 h-16 w-16 opacity-20" />
                <p>Nenhum usuário pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendentes.map(p => (
              <UserCard 
                key={p.id} profile={p} isUpdating={isUpdating} isSuperAdmin={isSuperAdmin}
                handleApprove={handleApprove} 
                onEditName={(u) => { setUserToEditName(u); setNewName(""); setEditNameDialogOpen(true); }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="aprovados" className="mt-4 space-y-3">
          {aprovados.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="py-16 text-center text-muted-foreground">
                <UserX className="mx-auto mb-6 h-16 w-16 opacity-20" />
                <p>Nenhum usuário aprovado</p>
              </CardContent>
            </Card>
          ) : (
            aprovados.map(p => (
              <UserCard 
                key={p.id} profile={p} isUpdating={isUpdating} isSuperAdmin={isSuperAdmin}
                handleReject={handleReject} handleToggleAdmin={handleToggleAdmin}
                onEditName={(u) => { setUserToEditName(u); setNewName(u.nome || ""); setEditNameDialogOpen(true); }}
                onUpdatePlan={(u) => { setUserToUpdatePlan(u); setSelectedPlan(u.plano || ""); setPlanDialogOpen(true); }}
                onDelete={(u) => { setUserToDelete(u); setDeleteDialogOpen(true); }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <UserManagementDialogs 
        deleteDialogOpen={deleteDialogOpen} setDeleteDialogOpen={setDeleteDialogOpen} userToDelete={userToDelete} isDeleting={isDeleting} handleDeleteComplete={handleDeleteComplete}
        editNameDialogOpen={editNameDialogOpen} setEditNameDialogOpen={setEditNameDialogOpen} userToEditName={userToEditName} newName={newName} setNewName={setNewName} handleUpdateName={handleUpdateName} isUpdating={isUpdating}
        planDialogOpen={planDialogOpen} setPlanDialogOpen={setPlanDialogOpen} userToUpdatePlan={userToUpdatePlan} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} handleUpdatePlan={handleUpdatePlan}
      />
    </div>
  );
}
