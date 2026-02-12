import { useState, useRef } from "react";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, User, Upload, X, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJogadores } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { positionLabels, type Jogador, type PlayerPosition } from "@/lib/types";
import { usePlanAccess } from "@/hooks/useSubscription";

type JogadorFormData = {
  nome: string;
  apelido: string;
  posicao: PlayerPosition;
  numero: string;
  telefone: string;
  email: string;
  ativo: boolean;
  foto_url: string | null;
};

const initialFormData: JogadorFormData = {
  nome: "",
  apelido: "",
  posicao: "atacante",
  numero: "",
  telefone: "",
  email: "",
  ativo: true,
  foto_url: null,
};

export default function AdminJogadores() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJogador, setEditingJogador] = useState<Jogador | null>(null);
  const [formData, setFormData] = useState<JogadorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerar Acesso state
  const [accessDialog, setAccessDialog] = useState<{ open: boolean; jogador: Jogador | null }>({ open: false, jogador: null });
  const [accessEmail, setAccessEmail] = useState("");
  const [isCreatingAccess, setIsCreatingAccess] = useState(false);

  const { team } = useTeamConfig();
  const { data: jogadores, isLoading } = useJogadores(false, team.id);
  const { profile } = useAuth();
  const { hasLoginJogadores } = usePlanAccess();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const openCreateDialog = () => {
    setEditingJogador(null);
    setFormData(initialFormData);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (jogador: Jogador) => {
    setEditingJogador(jogador);
    setFormData({
      nome: jogador.nome,
      apelido: jogador.apelido || "",
      posicao: jogador.posicao,
      numero: jogador.numero?.toString() || "",
      telefone: jogador.telefone || "",
      email: jogador.email || "",
      ativo: jogador.ativo,
      foto_url: jogador.foto_url || null,
    });
    setSelectedFile(null);
    setPreviewUrl(jogador.foto_url || null);
    setIsDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo inválido",
        description: "Use apenas JPG, PNG ou WebP",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeFoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ ...formData, foto_url: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFoto = async (jogadorId: string): Promise<string | null> => {
    if (!selectedFile) return formData.foto_url;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${jogadorId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("jogadores")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("jogadores")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível fazer upload da foto",
      });
      return formData.foto_url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let jogadorId = editingJogador?.id;

      // If creating, first insert to get the ID
      if (!editingJogador) {
        const { data: newJogador, error: insertError } = await supabase
          .from("jogadores")
          .insert({
            nome: formData.nome,
            apelido: formData.apelido || null,
            posicao: formData.posicao,
            numero: formData.numero ? parseInt(formData.numero) : null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            ativo: formData.ativo,
            team_id: profile?.team_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        jogadorId = newJogador.id;
      }

      // Upload photo if selected
      let fotoUrl = formData.foto_url;
      if (selectedFile && jogadorId) {
        fotoUrl = await uploadFoto(jogadorId);
      }

      // Update with photo URL (or update existing jogador)
      if (editingJogador || fotoUrl !== formData.foto_url) {
        const { error: updateError } = await supabase
          .from("jogadores")
          .update({
            nome: formData.nome,
            apelido: formData.apelido || null,
            posicao: formData.posicao,
            numero: formData.numero ? parseInt(formData.numero) : null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            ativo: formData.ativo,
            foto_url: fotoUrl,
          })
          .eq("id", jogadorId);

        if (updateError) throw updateError;
      }

      toast({ title: editingJogador ? "Jogador atualizado com sucesso!" : "Jogador cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
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
    if (!confirm("Tem certeza que deseja excluir este jogador?")) return;

    try {
      const { error } = await supabase.from("jogadores").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Jogador excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    }
  };

  const handleCreateAccess = async () => {
    if (!accessDialog.jogador || !accessEmail) return;
    setIsCreatingAccess(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-player-access", {
        body: { jogador_id: accessDialog.jogador.id, email: accessEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Acesso criado!",
        description: data?.message || `E-mail: ${accessEmail} / Senha: 2508futgestor5515@`,
      });
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
      setAccessDialog({ open: false, jogador: null });
      setAccessEmail("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsCreatingAccess(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jogadores</h2>
          <p className="text-muted-foreground">Gerencie o elenco do time</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Jogador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingJogador ? "Editar Jogador" : "Novo Jogador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto Upload */}
              <div className="space-y-2">
                <Label>Foto do Jogador</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-20 w-20 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-dashed border-border">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                        onClick={removeFoto}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {previewUrl ? "Trocar Foto" : "Escolher Foto"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou WebP. Máx 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apelido">Apelido</Label>
                  <Input
                    id="apelido"
                    value={formData.apelido}
                    onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="posicao">Posição</Label>
                  <Select
                    value={formData.posicao}
                    onValueChange={(value: PlayerPosition) => setFormData({ ...formData, posicao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    type="number"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Jogador ativo</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting || isUploading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : jogadores && jogadores.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jogadores.map((jogador) => (
            <Card key={jogador.id} className={!jogador.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {jogador.foto_url ? (
                      <img
                        src={jogador.foto_url}
                        alt={jogador.nome}
                        className="h-12 w-12 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                        {jogador.numero || <User className="h-5 w-5" />}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{jogador.nome}</h3>
                      {jogador.apelido && (
                        <p className="text-sm text-muted-foreground">"{jogador.apelido}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(jogador)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(jogador.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {jogador.numero !== null && (
                    <Badge variant="outline" className="font-mono">#{jogador.numero}</Badge>
                  )}
                  <Badge variant="secondary">{positionLabels[jogador.posicao]}</Badge>
                  {!jogador.ativo && <Badge variant="outline">Inativo</Badge>}
                  {jogador.user_id ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <KeyRound className="mr-1 h-3 w-3" /> Com acesso
                    </Badge>
                  ) : hasLoginJogadores ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        setAccessEmail(jogador.email || "");
                        setAccessDialog({ open: true, jogador });
                      }}
                    >
                      <KeyRound className="mr-1 h-3 w-3" /> Gerar Acesso
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum jogador cadastrado.
          </CardContent>
        </Card>
      )}

      {/* Dialog Gerar Acesso */}
      <Dialog open={accessDialog.open} onOpenChange={(open) => !open && setAccessDialog({ open: false, jogador: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Acesso para {accessDialog.jogador?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-email">E-mail do jogador</Label>
              <Input
                id="access-email"
                type="email"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
                placeholder="jogador@email.com"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Será criada uma conta com senha padrão: <strong>2508futgestor5515@</strong>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAccessDialog({ open: false, jogador: null })}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAccess} disabled={isCreatingAccess || !accessEmail}>
                {isCreatingAccess ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                ) : (
                  <><KeyRound className="mr-2 h-4 w-4" /> Gerar Acesso</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
