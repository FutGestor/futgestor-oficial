import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Bell, AlertTriangle, DollarSign, Trophy, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAvisos } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabels, type Aviso, type NoticeCategory } from "@/lib/types";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";

type AvisoFormData = {
  titulo: string;
  conteudo: string;
  categoria: NoticeCategory;
  publicado: boolean;
};

const initialFormData: AvisoFormData = {
  titulo: "",
  conteudo: "",
  categoria: "geral",
  publicado: true,
};

function getCategoryIcon(categoria: NoticeCategory) {
  switch (categoria) {
    case "urgente":
      return <AlertTriangle className="h-4 w-4" />;
    case "financeiro":
      return <DollarSign className="h-4 w-4" />;
    case "jogo":
      return <Trophy className="h-4 w-4" />;
    default:
      return <Megaphone className="h-4 w-4" />;
  }
}

import { useTeamConfig } from "@/hooks/useTeamConfig";

export default function AdminAvisos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState<AvisoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all notices including unpublished for admin
  const { team, basePath } = useTeamSlug();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreateDialog();
    }
  }, [searchParams]);
  const { data: avisos, isLoading } = useAvisos(undefined, team.id);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const openCreateDialog = () => {
    setEditingAviso(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (aviso: Aviso) => {
    setEditingAviso(aviso);
    setFormData({
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
      categoria: aviso.categoria,
      publicado: aviso.publicado,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        categoria: formData.categoria,
        publicado: formData.publicado,
        team_id: profile?.team_id,
      };

      if (editingAviso) {
        const { error } = await supabase
          .from("avisos")
          .update(data)
          .eq("id", editingAviso.id);

        if (error) throw error;
        toast({ title: "Aviso atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("avisos").insert(data);
        if (error) throw error;
        toast({ title: "Aviso publicado com sucesso!" });
      }

      queryClient.invalidateQueries({ queryKey: ["avisos"] });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

    try {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Aviso excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  return (
    <div className="space-y-6">
      <ManagementHeader 
        title="Gerenciar Mural de Avisos" 
        subtitle="Publique comunicados e informações importantes para o time." 
      />

      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAviso ? "Editar Aviso" : "Novo Aviso"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  rows={5}
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value: NoticeCategory) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    id="publicado"
                    checked={formData.publicado}
                    onCheckedChange={(checked) => setFormData({ ...formData, publicado: checked })}
                  />
                  <Label htmlFor="publicado">Publicar imediatamente</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : avisos && avisos.length > 0 ? (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <Card key={aviso.id} className={!aviso.publicado ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={aviso.categoria === "urgente" ? "destructive" : "secondary"}>
                        {getCategoryIcon(aviso.categoria)}
                        <span className="ml-1">{categoryLabels[aviso.categoria]}</span>
                      </Badge>
                      {!aviso.publicado && <Badge variant="outline">Rascunho</Badge>}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(aviso.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <h3 className="font-semibold">{aviso.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {aviso.conteudo}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(aviso)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(aviso.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Nenhum aviso publicado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
