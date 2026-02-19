import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, User, Upload, X, KeyRound, Loader2, QrCode, Copy, Share2, ExternalLink } from "lucide-react";
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
import { useJogadores } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { positionLabels, type Jogador, type PlayerPosition } from "@/lib/types";
import { usePlanAccess } from "@/hooks/useSubscription";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";

type JogadorFormData = {
  nome: string;
  apelido: string;
  posicao: PlayerPosition;
  numero: string;
  telefone: string;
  email: string;
  ativo: boolean;
  foto_url: string | null;
  pe_preferido: Jogador['pe_preferido'];
  peso_kg: string;
  altura_cm: string;
  bio: string;
  data_entrada: string;
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
  pe_preferido: null,
  peso_kg: "",
  altura_cm: "",
  bio: "",
  data_entrada: new Date().toISOString().split('T')[0],
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

  // Invite Link state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { team } = useTeamConfig();
  const { basePath } = useTeamSlug();
  const { data: jogadores, isLoading } = useJogadores(false, team.id);
  const { profile } = useAuth();
  const { hasLoginJogadores } = usePlanAccess();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Auto-open based on URL search param
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && jogadores && jogadores.length > 0) {
      const target = jogadores.find(j => j.id === editId || j.user_id === editId);
      if (target) {
        // Pequeno delay para garantir que o componente terminou de renderizar a lista
        setTimeout(() => openEditDialog(target), 0);
      }
    }
  }, [searchParams, jogadores]);

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
      pe_preferido: jogador.pe_preferido || null,
      peso_kg: jogador.peso_kg?.toString() || "",
      altura_cm: jogador.altura_cm?.toString() || "",
      bio: jogador.bio || "",
      data_entrada: jogador.data_entrada || new Date().toISOString().split('T')[0],
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
            pe_preferido: formData.pe_preferido || null,
            peso_kg: formData.peso_kg ? parseFloat(formData.peso_kg) : null,
            altura_cm: formData.altura_cm ? parseInt(formData.altura_cm) : null,
            bio: formData.bio || null,
            data_entrada: formData.data_entrada || null,
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
            pe_preferido: formData.pe_preferido || null,
            peso_kg: formData.peso_kg ? parseFloat(formData.peso_kg) : null,
            altura_cm: formData.altura_cm ? parseInt(formData.altura_cm) : null,
            bio: formData.bio || null,
            data_entrada: formData.data_entrada || null,
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

  const handleDelete = async (id: string, email: string | null) => {
    const message = email 
      ? `ATENÇÃO: Você está prestes a excluir este jogador DEFINITIVAMENTE. \n\nIsso removerá o acesso ao sistema (e-mail: ${email}) e todos os dados vinculados a ele. \n\nESTA AÇÃO NÃO PODE SER DESFEITA. Deseja continuar?`
      : "Tem certeza que deseja excluir este jogador? Todos os dados vinculados serão removidos.";

    if (!confirm(message)) return;

    try {
      const { error } = await supabase.rpc('delete_player_permanent', { _player_id: id });
      
      if (error) throw error;
      
      toast({ title: "Jogador e acesso removidos com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar excluir permanentemente.",
      });
    }
  };

  const copyInviteLink = () => {
    if (!team?.invite_code || team.invite_code === "undefined") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O código de convite ainda não foi gerado. Verifique a configuração do banco de dados.",
      });
      return;
    }
    const link = `${window.location.origin}/convite/${team.invite_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link de convite foi copiado para sua área de transferência.",
    });
  };

  const copyTeamCode = () => {
    if (!team?.invite_code || team.invite_code === "undefined") return;
    navigator.clipboard.writeText(team.invite_code);
    toast({
      title: "Código copiado!",
      description: "O código do time foi copiado para sua área de transferência.",
    });
  };

  const shareOnWhatsApp = () => {
    if (!team?.invite_code || team.invite_code === "undefined") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O código de convite ainda não foi gerado.",
      });
      return;
    }
    const link = `${window.location.origin}/convite/${team.invite_code}`;
    const text = `Entre para o time ${team?.nome} no FutGestor: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
      <ManagementHeader 
        title="Gerenciar Elenco" 
        subtitle="Adicione jogadores, edite informações e gerencie acessos." 
      />

      <div className="flex justify-end gap-2">
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              <Share2 className="mr-2 h-4 w-4" />
              Convidar Atletas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Atletas</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-4">
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity" 
                onClick={copyTeamCode}
                title="Clique para copiar o código"
              >
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Código do Time</span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tracking-widest text-primary">{team?.invite_code || "------"}</span>
                  <Copy className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
              
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label>Link de Convite</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/convite/${team?.invite_code}`}
                      className="bg-black/20 border-white/10"
                    />
                    <Button size="icon" variant="secondary" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" 
                  onClick={shareOnWhatsApp}
                  disabled={!team?.invite_code || team.invite_code === "undefined"}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Enviar no WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Jogador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Dados Físicos e Bio</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pe_preferido">Pé Preferido</Label>
                    <Select
                      value={formData.pe_preferido || "nao_informado"}
                      onValueChange={(value: any) => setFormData({ ...formData, pe_preferido: value === "nao_informado" ? null : value })}
                    >
                      <SelectTrigger id="pe_preferido">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_informado">Não informado</SelectItem>
                        <SelectItem value="destro">Destro</SelectItem>
                        <SelectItem value="canhoto">Canhoto</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso_kg">Peso (kg)</Label>
                    <Input
                      id="peso_kg"
                      type="number"
                      step="0.1"
                      placeholder="75.0"
                      value={formData.peso_kg}
                      onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altura_cm">Altura (cm)</Label>
                    <Input
                      id="altura_cm"
                      type="number"
                      placeholder="178"
                      value={formData.altura_cm}
                      onChange={(e) => setFormData({ ...formData, altura_cm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_entrada">Data de Entrada</Label>
                    <Input
                      id="data_entrada"
                      type="date"
                      value={formData.data_entrada}
                      onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (máx 300 caracteres)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Uma breve descrição do jogador..."
                    maxLength={300}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="resize-none h-20"
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
            <Card key={jogador.id} className={cn("bg-black/40 backdrop-blur-xl border-white/10", !jogador.ativo ? "opacity-60" : "")}>
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
                      <h3 className="font-black uppercase italic tracking-tight text-white">{jogador.nome}</h3>
                      {jogador.apelido && (
                        <p className="text-xs font-medium uppercase tracking-widest text-primary/80">"{jogador.apelido}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(jogador)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(jogador.id, jogador.email)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {jogador.numero !== null && (
                    <Badge variant="outline" className="font-mono">#{jogador.numero}</Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/5 border-white/10 uppercase tracking-widest text-[10px]">{positionLabels[jogador.posicao]}</Badge>
                  {!jogador.ativo && <Badge variant="outline">Inativo</Badge>}
                  {jogador.user_id && (
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-green-400 border-green-500/30 bg-green-500/10">
                      <KeyRound className="mr-1 h-3 w-3" /> ACESSO ATIVO
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum jogador cadastrado.
          </CardContent>
        </Card>
      )}

      </div>
    </Layout>
  );
}
