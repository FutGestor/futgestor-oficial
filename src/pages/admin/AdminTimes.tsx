import { useState, useRef } from "react";
import { Plus, Edit, Trash2, Shield, Home, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTimes, useCreateTime, useUpdateTime, useDeleteTime } from "@/hooks/useTimes";
import { useAuth } from "@/hooks/useAuth";
import type { Time } from "@/lib/types";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";

type TimeFormData = {
  nome: string;
  apelido: string;
  cidade: string;
  cores_principais: string;
  is_casa: boolean;
  ativo: boolean;
};

const initialFormData: TimeFormData = {
  nome: "",
  apelido: "",
  cidade: "",
  cores_principais: "",
  is_casa: false,
  ativo: true,
};

export default function AdminTimes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeToDelete, setTimeToDelete] = useState<Time | null>(null);
  const [jogosVinculados, setJogosVinculados] = useState<number>(0);
  const [editingTime, setEditingTime] = useState<Time | null>(null);
  const [formData, setFormData] = useState<TimeFormData>(initialFormData);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const { profile } = useAuth();
  const { team, basePath } = useTeamSlug();
  const { data: times, isLoading } = useTimes(profile?.team_id);
  const createTime = useCreateTime();
  const updateTime = useUpdateTime();
  const deleteTime = useDeleteTime();
  const { toast } = useToast();

  const openCreateDialog = () => {
    setEditingTime(null);
    setFormData(initialFormData);
    setSelectedImage(null);
    setImagePreview(null);
    setCroppedBlob(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (time: Time) => {
    setEditingTime(time);
    setFormData({
      nome: time.nome,
      apelido: time.apelido || "",
      cidade: time.cidade || "",
      cores_principais: time.cores_principais || "",
      is_casa: time.is_casa,
      ativo: time.ativo,
    });
    setSelectedImage(null);
    setCroppedBlob(null);
    setImagePreview(time.escudo_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedBlob(blob);
    setImagePreview(URL.createObjectURL(blob));
    setIsCropModalOpen(false);
    setTempImage(null);
  };

  const uploadEscudo = async (timeId: string): Promise<string | null> => {
    if (!croppedBlob) return editingTime?.escudo_url || null;

    const fileName = `${timeId}.jpg`;
    const filePath = `escudos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("times")
      .upload(filePath, croppedBlob, { 
        contentType: "image/jpeg",
        upsert: true 
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("times").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      if (editingTime) {
        let escudo_url = editingTime.escudo_url;
        if (croppedBlob) {
          escudo_url = await uploadEscudo(editingTime.id);
        }

        await updateTime.mutateAsync({
          id: editingTime.id,
          nome: formData.nome,
          apelido: formData.apelido || null,
          cidade: formData.cidade || null,
          cores_principais: formData.cores_principais || null,
          is_casa: formData.is_casa,
          ativo: formData.ativo,
          escudo_url,
        });

        toast({ title: "Time atualizado com sucesso!" });
      } else {
        // Cria o time primeiro para ter o ID
        const newTime = await createTime.mutateAsync({
          nome: formData.nome,
          apelido: formData.apelido || null,
          cidade: formData.cidade || null,
          cores_principais: formData.cores_principais || null,
          is_casa: formData.is_casa,
          ativo: formData.ativo,
          escudo_url: null,
          team_id: profile?.team_id || null,
        });

        // Faz upload do escudo se existir
        if (croppedBlob && newTime) {
          const escudo_url = await uploadEscudo(newTime.id);
          await updateTime.mutateAsync({
            id: newTime.id,
            escudo_url,
          });
        }

        toast({ title: "Time criado com sucesso!" });
      }

      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!timeToDelete) return;

    try {
      // Remove escudo do storage
      if (timeToDelete.escudo_url) {
        const path = timeToDelete.escudo_url.split("/").slice(-2).join("/");
        await supabase.storage.from("times").remove([path]);
      }

      await deleteTime.mutateAsync(timeToDelete.id);
      toast({ title: "Time excluído com sucesso!" });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTimeToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
      <ManagementHeader 
        title="Gerenciar Times" 
        subtitle="Cadastre seu próprio time e os adversários para histórico de jogos." 
      />

      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTime ? "Editar Time" : "Novo Time"}
              </DialogTitle>
              <DialogDescription>
                {editingTime ? "Edite as informações do time" : "Cadastre um novo time"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Upload de Escudo */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/20 bg-black/20 transition-colors hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Escudo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  Clique para adicionar escudo
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Time *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: FC Meu Time"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido / Nome Curto</Label>
                <Input
                  id="apelido"
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  placeholder="Ex: Tralhas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cores">Cores Principais</Label>
                <Input
                  id="cores"
                  value={formData.cores_principais}
                  onChange={(e) => setFormData({ ...formData, cores_principais: e.target.value })}
                  placeholder="Ex: Azul e Branco"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="is_casa" className="cursor-pointer">Time da Casa</Label>
                  <p className="text-sm text-muted-foreground">
                    Marque se este é o seu time principal
                  </p>
                </div>
                <Switch
                  id="is_casa"
                  checked={formData.is_casa}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_casa: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="ativo" className="cursor-pointer">Time Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Times inativos não aparecem nas listagens
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUploading || createTime.isPending || updateTime.isPending}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : times && times.length > 0 ? (
        <div className="space-y-4">
          {times.map((time) => (
            <Card key={time.id} className={cn("bg-black/40 backdrop-blur-xl border-white/10", time.is_casa ? "border-primary" : "")}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-black/20 border border-white/10">
                    <img
                      src={time.escudo_url || ESCUDO_PADRAO}
                      alt={time.nome}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{time.nome}</h3>
                      {time.is_casa && (
                        <Badge variant="default" className="gap-1">
                          <Home className="h-3 w-3" />
                          Casa
                        </Badge>
                      )}
                      {!time.ativo && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {time.apelido && <span>({time.apelido})</span>}
                      {time.cidade && <span>• {time.cidade}</span>}
                      {time.cores_principais && <span>• {time.cores_principais}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(time)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={async () => {
                      // Verificar jogos vinculados antes de abrir o dialog
                      const { count } = await supabase
                        .from("jogos")
                        .select("*", { count: "exact", head: true })
                        .eq("time_adversario_id", time.id);
                      
                      setJogosVinculados(count || 0);
                      setTimeToDelete(time);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Shield className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-bold">Nenhum time cadastrado.</p>
            <p className="text-sm">Comece adicionando o seu time e os adversários.</p>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Time</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Tem certeza que deseja excluir o time "{timeToDelete?.nome}"?</p>
                {jogosVinculados > 0 && (
                  <p className="mt-2 text-warning">
                    ⚠️ Este time está vinculado a {jogosVinculados} jogo(s). 
                    O vínculo será removido, mas o nome do adversário será mantido.
                  </p>
                )}
                <p className="mt-2">Esta ação não pode ser desfeita.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tempImage && (
        <ImageCropperModal
          image={tempImage}
          isOpen={isCropModalOpen}
          onClose={() => {
            setIsCropModalOpen(false);
            setTempImage(null);
          }}
          onCropComplete={handleCropComplete}
          aspect={1}
        />
      )}
      </div>
    </Layout>
  );
}
