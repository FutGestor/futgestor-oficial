import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Check, X, Clock, UserCheck, UserX, Shield, ShieldOff,
    Trash2, Pencil, CreditCard, Search, Filter, ArrowLeft,
    Users, Users2, Star, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

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
    isSuperAdmin?: boolean;
    teamName?: string;
}

export default function SuperAdminUsuarios() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isSuperAdmin: authIsSuperAdmin, isLoading: authLoading } = useAuth();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<ProfileWithEmail | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPlan, setFilterPlan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

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
        queryKey: ["super-admin-profiles"],
        enabled: authIsSuperAdmin,
        queryFn: async () => {
            const { data: profilesData, error: profilesError } = await supabase
                .rpc("get_admin_users_full" as any);

            if (profilesError) throw profilesError;

            // Roles
            const { data: rolesData } = await supabase
                .from("user_roles")
                .select("user_id, role");

            // Team Names
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

            return (profilesData || [])
                .map(p => ({
                    ...p,
                    isAdmin: adminIds.has(p.id),
                    isSuperAdmin: superAdminIds.has(p.id),
                    teamName: p.team_id ? teamNamesMap[p.team_id] : undefined
                })) as ProfileWithEmail[];
        },
    });

    const filteredProfiles = useMemo(() => {
        if (!profiles) return [];
        return profiles.filter(p => {
            const matchesSearch =
                (p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (p.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

            const matchesPlan = filterPlan === "all" || p.plano === filterPlan;
            const matchesStatus = filterStatus === "all" ||
                (filterStatus === "pending" && !p.aprovado) ||
                (filterStatus === "approved" && p.aprovado);

            return matchesSearch && matchesPlan && matchesStatus;
        });
    }, [profiles, searchTerm, filterPlan, filterStatus]);

    const toggleSelectAll = () => {
        if (selectedUserIds.size === filteredProfiles.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(filteredProfiles.map(p => p.id)));
        }
    };

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUserIds(newSelected);
    };

    const handleBulkApprove = async () => {
        if (selectedUserIds.size === 0) return;
        setIsBulkActionLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ aprovado: true })
                .in("id", Array.from(selectedUserIds));

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
            toast({ title: `${selectedUserIds.size} usuários aprovados com sucesso!` });
            setSelectedUserIds(new Set());
        } catch (error) {
            toast({ variant: "destructive", title: "Erro na aprovação em massa", description: error instanceof Error ? error.message : "Ocorreu um erro" });
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.size === 0) return;
        if (!confirm(`Deseja realmente excluir permanentemente ${selectedUserIds.size} usuários?`)) return;

        setIsBulkActionLoading(true);
        try {
            // Processing in chunks or sequential to ensure all are deleted if RPC has limits
            const ids = Array.from(selectedUserIds);
            const results = await Promise.all(ids.map(id =>
                supabase.rpc("admin_delete_user" as any, { _user_id: id })
            ));

            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw errors[0].error;

            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
            toast({ title: `${ids.length} usuários excluídos permanentemente!` });
            setSelectedUserIds(new Set());
        } catch (error) {
            toast({ variant: "destructive", title: "Erro na exclusão em massa", description: error instanceof Error ? error.message : "Ocorreu um erro" });
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleBulkSetPlan = async (plan: string) => {
        if (selectedUserIds.size === 0) return;
        setIsBulkActionLoading(true);
        try {
            // Plan updates need to be team-based, but our selection is user-based.
            // We'll get all unique team_ids from selected users.
            const selectedTeams = [...new Set(
                filteredProfiles
                    .filter(p => selectedUserIds.has(p.id))
                    .map(p => p.team_id)
                    .filter(Boolean)
            )] as string[];

            if (selectedTeams.length === 0) {
                toast({ variant: "destructive", title: "Nenhum time associado aos usuários selecionados" });
                return;
            }

            const results = await Promise.all(selectedTeams.map(team_id =>
                supabase.rpc("admin_set_plan" as any, {
                    _team_id: team_id,
                    _plan_type: plan
                })
            ));

            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw errors[0].error;

            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
            toast({ title: `Plano atualizado para ${selectedTeams.length} times!` });
            setSelectedUserIds(new Set());
        } catch (error) {
            toast({ variant: "destructive", title: "Erro na atualização em massa", description: error instanceof Error ? error.message : "Ocorreu um erro" });
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (!profiles) return { total: 0, pending: 0, paid: 0 };
        return {
            total: profiles.length,
            pending: profiles.filter(p => !p.aprovado).length,
            paid: profiles.filter(p => p.plano && p.plano !== "free").length
        };
    }, [profiles]);

    const handleApprove = async (profileId: string) => {
        setIsUpdating(profileId);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ aprovado: true })
                .eq("id", profileId);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
            toast({ title: "Usuário aprovado com sucesso!" });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao aprovar",
                description: error instanceof Error ? error.message : "Ocorreu um erro",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleToggleAdmin = async (profileId: string, role: 'admin' | 'super_admin', isActive: boolean) => {
        setIsUpdating(profileId);
        try {
            if (isActive) {
                const { error } = await supabase
                    .from("user_roles")
                    .delete()
                    .eq("user_id", profileId)
                    .eq("role", role);
                if (error) throw error;
                toast({ title: `Permissão de ${role} removida!` });
            } else {
                const { error } = await supabase
                    .from("user_roles")
                    .insert({ user_id: profileId, role });
                if (error) throw error;
                toast({ title: `Usuário promovido a ${role}!` });
            }
            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
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

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc("admin_delete_user" as any, {
                _user_id: userToDelete.id
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
            toast({ title: "Usuário excluído permanentemente!" });
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: error instanceof Error ? error.message : "Ocorreu um erro",
            });
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    if (authLoading) return null;
    if (!authIsSuperAdmin) return <Navigate to="/" replace />;

    return (
        <Layout>
            <div className="min-h-screen bg-[#0A1628]">
                <div className="container py-8 px-4 md:px-6">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/super-admin")}
                                className="text-gray-400 hover:text-white border border-white/10"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao Painel Master
                            </Button>
                            <div>
                                <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-1">👥 Gestão Global</p>
                                <h1 className="text-3xl font-bold text-white">Controle de Usuários</h1>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card className="bg-[#0F2440] border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Total de Usuários</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.total}</div>
                                <p className="text-[10px] text-gray-500 mt-1">Registrados na plataforma</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0F2440] border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Pendentes</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.pending}</div>
                                <p className="text-[10px] text-gray-500 mt-1">Aguardando aprovação</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0F2440] border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase">Assinaturas Ativas</CardTitle>
                                <Star className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.paid}</div>
                                <p className="text-[10px] text-gray-500 mt-1">Planos Pro ou Liga</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Table */}
                    <Card className="bg-[#0F2440] border-white/10 overflow-hidden">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Buscar por nome, email ou time..."
                                        className="pl-9 bg-black/20 border-white/10 text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                                        <SelectTrigger className="w-full md:w-32 bg-black/20 border-white/10 text-white">
                                            <SelectValue placeholder="Plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos Planos</SelectItem>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="liga">Liga</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-full md:w-32 bg-black/20 border-white/10 text-white">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos Status</SelectItem>
                                            <SelectItem value="pending">Pendentes</SelectItem>
                                            <SelectItem value="approved">Aprovados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/5 hover:bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="w-12 px-4 py-4">
                                                <Checkbox
                                                    checked={filteredProfiles.length > 0 && selectedUserIds.size === filteredProfiles.length}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-white/20 data-[state=checked]:bg-[#D4A84B] data-[state=checked]:border-[#D4A84B]"
                                                />
                                            </TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Usuário</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Time</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Plano</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Poderes</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Data</TableHead>
                                            <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px]">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <TableRow key={i} className="border-white/5"><TableCell colSpan={6}><Skeleton className="h-12 w-full bg-white/5" /></TableCell></TableRow>
                                            ))
                                        ) : filteredProfiles.length === 0 ? (
                                            <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="h-40 text-center text-gray-500">Nenhum usuário encontrado</TableCell></TableRow>
                                        ) : (
                                            filteredProfiles.map(profile => (
                                                <TableRow key={profile.id} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell className="px-4 py-4">
                                                        <Checkbox
                                                            checked={selectedUserIds.has(profile.id)}
                                                            onCheckedChange={() => toggleSelectUser(profile.id)}
                                                            className="border-white/20 data-[state=checked]:bg-[#D4A84B] data-[state=checked]:border-[#D4A84B]"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium">{profile.nome || "Sem nome"}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono tracking-tight">{profile.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-gray-300 text-xs">{profile.teamName || "—"}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {profile.plano ? (
                                                            <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${profile.plano === 'liga' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                profile.plano === 'pro' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                                }`}>
                                                                {profile.plano.toUpperCase()}
                                                            </Badge>
                                                        ) : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {!profile.aprovado && (
                                                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] h-4">BLOQUEADO</Badge>
                                                            )}
                                                            {profile.isAdmin && (
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] h-4">ADMIN</Badge>
                                                            )}
                                                            {profile.isSuperAdmin && (
                                                                <Badge className="bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20 text-[9px] h-4">MASTER</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-[10px]">
                                                        {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {!profile.aprovado && (
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleApprove(profile.id)}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" title="Alterar Plano" onClick={() => {
                                                                setUserToUpdatePlan(profile);
                                                                setSelectedPlan(profile.plano || "");
                                                                setPlanDialogOpen(true);
                                                            }}>
                                                                <CreditCard className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className={`h-8 w-8 ${profile.isAdmin ? 'text-primary' : 'text-gray-500'} hover:bg-primary/10`}
                                                                onClick={() => handleToggleAdmin(profile.id, 'admin', !!profile.isAdmin)}
                                                                title={profile.isAdmin ? "Remover Admin" : "Tornar Admin"}
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className={`h-8 w-8 ${profile.isSuperAdmin ? 'text-[#D4A84B]' : 'text-gray-500'} hover:bg-[#D4A84B]/10`}
                                                                onClick={() => handleToggleAdmin(profile.id, 'super_admin', !!profile.isSuperAdmin)}
                                                                title={profile.isSuperAdmin ? "Remover Master" : "Tornar Master"}
                                                            >
                                                                <ShieldAlert className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => {
                                                                setUserToDelete(profile);
                                                                setDeleteDialogOpen(true);
                                                            }}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#0F2440] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão Permanente</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Deseja excluir permanentemente o usuário <strong>{userToDelete?.nome || userToDelete?.email}</strong>?
                            Esta ação removerá todos os dados do usuário do sistema e não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white" disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none" disabled={isDeleting}>
                            {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent className="bg-[#0F2440] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Plano do Time</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Alterar o plano para o time de {userToUpdatePlan?.nome}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0F2440] border-white/10 text-white">
                                <SelectItem value="free">Free (Gratuito)</SelectItem>
                                <SelectItem value="pro">Pro (Intermediário)</SelectItem>
                                <SelectItem value="liga">Liga (Completo)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
                        <Button className="bg-[#D4A84B] hover:bg-[#B8913B] text-white border-none" onClick={async () => {
                            if (!userToUpdatePlan?.team_id) return;
                            try {
                                const { error } = await supabase.rpc("admin_set_plan" as any, {
                                    _team_id: userToUpdatePlan.team_id,
                                    _plan_type: selectedPlan
                                });
                                if (error) throw error;
                                toast({ title: "Plano atualizado com sucesso!" });
                                setPlanDialogOpen(false);
                                queryClient.invalidateQueries({ queryKey: ["super-admin-profiles"] });
                            } catch (err: any) {
                                toast({ variant: "destructive", title: "Erro ao atualizar", description: err.message });
                            }
                        }}>Atualizar Plano</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Actions Bar */}
            {selectedUserIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-[#0F2440] border border-[#D4A84B]/30 shadow-2xl shadow-black/50 px-6 py-4 rounded-2xl flex items-center gap-6 backdrop-blur-md">
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                            <div className="bg-[#D4A84B] text-white font-bold h-6 w-6 rounded-full flex items-center justify-center text-xs">
                                {selectedUserIds.size}
                            </div>
                            <span className="text-white font-medium text-sm">Selecionados</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-9"
                                onClick={handleBulkApprove}
                                disabled={isBulkActionLoading}
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Aprovar
                            </Button>

                            <Select onValueChange={handleBulkSetPlan} disabled={isBulkActionLoading}>
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white h-9 text-xs font-bold">
                                    <SelectValue placeholder="Alterar Plano" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0F2440] border-white/10 text-white">
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="liga">Liga</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold h-9"
                                onClick={handleBulkDelete}
                                disabled={isBulkActionLoading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5 font-bold h-9"
                                onClick={() => setSelectedUserIds(new Set())}
                                disabled={isBulkActionLoading}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
