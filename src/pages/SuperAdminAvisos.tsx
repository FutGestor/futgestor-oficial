import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Plus, Megaphone, Trash2, Pencil,
    Eye, EyeOff, ArrowLeft, Loader2,
    AlertTriangle, Info, DollarSign, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type Aviso = {
    id: string;
    titulo: string;
    conteudo: string;
    categoria: "geral" | "urgente" | "financeiro" | "jogo";
    publicado: boolean;
    created_at: string;
    team_id: string | null;
};

export default function SuperAdminAvisos() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isSuperAdmin, isLoading: authLoading } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);

    // Form State
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [categoria, setCategoria] = useState<"geral" | "urgente" | "financeiro" | "jogo">("geral");
    const [publicado, setPublicado] = useState(true);

    const { data: avisos, isLoading } = useQuery({
        queryKey: ["super-admin-avisos"],
        enabled: isSuperAdmin,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("avisos")
                .select("*")
                .is("team_id", null)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Aviso[];
        },
    });

    const handleOpenDialog = (aviso?: Aviso) => {
        if (aviso) {
            setEditingAviso(aviso);
            setTitulo(aviso.titulo);
            setConteudo(aviso.conteudo);
            setCategoria(aviso.categoria);
            setPublicado(aviso.publicado);
        } else {
            setEditingAviso(null);
            setTitulo("");
            setConteudo("");
            setCategoria("geral");
            setPublicado(true);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!titulo || !conteudo) {
            toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos." });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingAviso) {
                const { error } = await supabase
                    .from("avisos")
                    .update({ titulo, conteudo, categoria, publicado, updated_at: new Date().toISOString() })
                    .eq("id", editingAviso.id);
                if (error) throw error;
                toast({ title: "Aviso atualizado!" });
            } else {
                const { error } = await supabase
                    .from("avisos")
                    .insert({ titulo, conteudo, categoria, publicado, team_id: null });
                if (error) throw error;
                toast({ title: "Aviso global criado com sucesso!" });
            }
            queryClient.invalidateQueries({ queryKey: ["super-admin-avisos"] });
            setIsDialogOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Erro", description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Deseja realmente excluir este aviso global?")) return;
        try {
            const { error } = await supabase.from("avisos").delete().eq("id", id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["super-admin-avisos"] });
            toast({ title: "Aviso excluído!" });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: err.message });
        }
    };

    const togglePublication = async (aviso: Aviso) => {
        try {
            const { error } = await supabase
                .from("avisos")
                .update({ publicado: !aviso.publicado })
                .eq("id", aviso.id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["super-admin-avisos"] });
            toast({ title: aviso.publicado ? "Aviso desativado" : "Aviso publicado" });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Erro", description: err.message });
        }
    };

    if (authLoading) return null;
    if (!isSuperAdmin) return <Navigate to="/" replace />;

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "urgente": return <AlertTriangle className="h-3 w-3" />;
            case "financeiro": return <DollarSign className="h-3 w-3" />;
            case "jogo": return <Trophy className="h-3 w-3" />;
            default: return <Info className="h-3 w-3" />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "urgente": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "financeiro": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "jogo": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

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
                                <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-1">📣 Comunicados</p>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Avisos Globais</h1>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-[#D4A84B] hover:bg-[#B8913B] text-white font-bold"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Aviso Global
                        </Button>
                    </div>

                    <Card className="bg-[#0F2440] border-white/10 overflow-hidden">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-[#D4A84B]" />
                                Histórico de Comunicados
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Estes avisos aparecem para todos os usuários logados na plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px] py-4">Status</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Categoria</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Título</TableHead>
                                            <TableHead className="text-gray-400 font-bold uppercase text-[10px]">Data de Criação</TableHead>
                                            <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px]">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [1, 2, 3].map(i => (
                                                <TableRow key={i} className="border-white/5">
                                                    <TableCell colSpan={5}><div className="h-12 w-full animate-pulse bg-white/5 rounded" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : (avisos?.length || 0) === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={5} className="h-40 text-center text-gray-500">
                                                    Nenhum aviso global criado ainda.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            avisos?.map(aviso => (
                                                <TableRow key={aviso.id} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell>
                                                        <Badge variant="outline" className={aviso.publicado ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                                                            {aviso.publicado ? "Ativo" : "Inativo"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`gap-1 ${getCategoryColor(aviso.categoria)}`}>
                                                            {getCategoryIcon(aviso.categoria)}
                                                            {aviso.categoria.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-white max-w-[300px] truncate">
                                                        {aviso.titulo}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-xs">
                                                        {format(new Date(aviso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => togglePublication(aviso)}>
                                                                {aviso.publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" onClick={() => handleOpenDialog(aviso)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(aviso.id)}>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[#0F2440] border-white/10 text-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingAviso ? "Editar Aviso Global" : "Novo Aviso Global"}</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Crie uma mensagem que será exibida para todos os usuários da plataforma.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Título do Aviso</label>
                            <Input
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                placeholder="Ex: Nova funcionalidade lançada!"
                                className="bg-black/20 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Categoria</label>
                                <Select value={categoria} onValueChange={(v: any) => setCategoria(v)}>
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0F2440] border-white/10 text-white">
                                        <SelectItem value="geral">Geral</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                        <SelectItem value="financeiro">Financeiro</SelectItem>
                                        <SelectItem value="jogo">Jogo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Visibilidade</label>
                                <Select value={publicado ? "true" : "false"} onValueChange={v => setPublicado(v === "true")}>
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0F2440] border-white/10 text-white">
                                        <SelectItem value="true">Publicado</SelectItem>
                                        <SelectItem value="false">Rascunho</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Conteúdo (Markdown suportado)</label>
                            <Textarea
                                value={conteudo}
                                onChange={e => setConteudo(e.target.value)}
                                placeholder="Descreva o comunicado em detalhes..."
                                className="bg-black/20 border-white/10 text-white min-h-[120px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button className="bg-[#D4A84B] hover:bg-[#B8913B] text-white font-bold" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingAviso ? "Salvar Alterações" : "Criar Comunicado"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
