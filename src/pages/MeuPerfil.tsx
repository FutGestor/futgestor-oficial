import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera, Loader2, Trophy, Target, Shield, Zap, History, Edit3, CheckCircle2, AlertCircle, Instagram, Youtube, Facebook, MessageCircle, Upload, Save, Building2, UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { supabase } from "@/integrations/supabase/client";
import { positionLabels, type Jogador } from "@/lib/types";
import type { Database } from "@/integrations/supabase/types";
import { MeuPlanoSection } from "@/components/MeuPlanoSection";
import { StickerCard } from "@/components/public/StickerCard";
import { usePlayerPerformance } from "@/hooks/useEstatisticas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useQueryClient } from "@tanstack/react-query";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { FutGestorLogo } from "@/components/FutGestorLogo";

type PlayerPosition = Database["public"]["Enums"]["player_position"];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  apelido: z.string().optional(),
  posicao: z.enum(["goleiro", "zagueiro", "lateral", "volante", "meia", "atacante"]).optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  atual: z.string().min(1, "Senha atual é obrigatória"),
  nova: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmar: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.nova === data.confirmar, {
  message: "As senhas não coincidem",
  path: ["confirmar"],
});

type FormData = z.infer<typeof formSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, isApproved, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const teamSlug = useOptionalTeamSlug();
  const basePath = teamSlug?.basePath || "";
  
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [isLoadingJogador, setIsLoadingJogador] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Team Identity State
  const { team, isLoading: teamLoading } = useTeamConfig();
  const queryClient = useQueryClient();
  const [teamNome, setTeamNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [uploadingEscudo, setUploadingEscudo] = useState(false);
  const escudoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (team) {
      setTeamNome(team.nome || "");
      setCidade(team.cidade || "");
      setEstado(team.estado || "");
      setInstagram(team.redes_sociais?.instagram || "");
      setYoutube(team.redes_sociais?.youtube || "");
      setFacebook(team.redes_sociais?.facebook || "");
      setWhatsapp(team.redes_sociais?.whatsapp || "");
    }
  }, [team]);

  // Performance data
  const { data: performance } = usePlayerPerformance(profile?.jogador_id || undefined, profile?.team_id || undefined);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      apelido: "",
      posicao: "meia",
      telefone: "",
      email: "",
    },
  });

  const pwForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      atual: "",
      nova: "",
      confirmar: "",
    },
  });

  // Redirect if not logged in or not approved
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (!authLoading && user && !isApproved) {
      toast({
        title: "Acesso restrito",
        description: "Seu cadastro ainda está pendente de aprovação.",
        variant: "destructive",
      });
      if (basePath) {
        navigate(basePath);
      } else {
        navigate("/");
      }
    }
  }, [authLoading, user, isApproved, navigate, toast, basePath]);

  // Load jogador data if exists
  useEffect(() => {
    async function loadJogador() {
      if (!profile?.jogador_id) {
        // Pre-fill name from profile
        if (profile?.nome) {
          form.setValue("nome", profile.nome);
        }
        setIsLoadingJogador(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("jogadores")
          .select("*")
          .eq("id", profile.jogador_id)
          .single();

        if (error) throw error;

        if (data) {
          setJogador(data);
          setFotoUrl(data.foto_url);
          form.reset({
            nome: data.nome,
            apelido: data.apelido || "",
            posicao: data.posicao as PlayerPosition,
            telefone: data.telefone || "",
            email: data.email || "",
          });
        }
      } catch (error) {
        console.error("Error loading jogador:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingJogador(false);
      }
    }

    if (profile !== null) {
      loadJogador();
    }
  }, [profile, form, toast]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("jogadores")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("jogadores")
        .getPublicUrl(filePath);

      setFotoUrl(publicUrl);
      toast({
        title: "Foto carregada",
        description: "Sua foto foi enviada com sucesso. Clique em Salvar para confirmar.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error uploading photo:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a foto.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (jogador) {
        // Update existing jogador
        const { error } = await supabase
          .from("jogadores")
          .update({
            nome: data.nome,
            apelido: data.apelido || null,
            posicao: data.posicao,
            telefone: data.telefone || null,
            email: data.email || null,
            foto_url: fotoUrl,
          })
          .eq("id", jogador.id);

        if (error) throw error;

        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso!",
        });
        setIsEditDialogOpen(false);
      } else {
        // Create new jogador
        const { data: newJogador, error: insertError } = await supabase
          .from("jogadores")
          .insert({
            nome: data.nome,
            apelido: data.apelido || null,
            posicao: data.posicao,
            telefone: data.telefone || null,
            email: data.email || null,
            foto_url: fotoUrl,
            user_id: user.id,
            ativo: true,
            team_id: profile?.team_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update profile with jogador_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ jogador_id: newJogador.id })
          .eq("id", user.id);

        if (profileError) throw profileError;

        setJogador(newJogador);
        await refreshProfile();
        setIsEditDialogOpen(false);

        toast({
          title: "Perfil criado",
          description: "Seu perfil de jogador foi criado com sucesso!",
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error saving jogador:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    if (!user?.email) return;

    setIsUpdatingPassword(true);
    try {
      // 1. Validar a senha atual tentando fazer um login silencioso
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.atual,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta. Verifique e tente novamente.");
      }

      // 2. Atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.nova,
      });

      if (updateError) throw updateError;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso!",
      });
      pwForm.reset();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error updating password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const onSaveTeam = async () => {
    if (!profile?.team_id) return;
    setSavingTeam(true);
    try {
      const redes_sociais = {
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        facebook: facebook.trim(),
        whatsapp: whatsapp.trim(),
      };

      const { error } = await supabase
        .from("teams")
        .update({
          nome: teamNome.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
          redes_sociais,
        })
        .eq("id", profile.team_id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      toast({ title: "Sucesso", description: "Identidade do clube atualizada!" });
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSavingTeam(false);
    }
  };

  const handleEscudoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.team_id) return;
    setUploadingEscudo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.team_id}/escudo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("times").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("times").getPublicUrl(path);
      await supabase.from("teams").update({ escudo_url: publicUrl }).eq("id", profile.team_id);
      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      toast({ title: "Escudo atualizado!" });
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingEscudo(false);
    }
  };

  if (authLoading || isLoadingJogador) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !isApproved) {
    return null;
  }

  // Calculate stats summary
  const statsSummary = performance?.playerStats ? {
    jogos: performance.playerStats.filter(s => s.participou).length,
    gols: performance.playerStats.reduce((acc, s) => acc + (s.gols || 0), 0),
    assistencias: performance.playerStats.reduce((acc, s) => acc + (s.assistencias || 0), 0),
    mvp: performance.playerStats.filter(s => s.resultado?.mvp_jogador_id === profile?.jogador_id).length,
    amarelos: performance.playerStats.filter(s => s.cartao_amarelo).length,
    vermelhos: performance.playerStats.filter(s => s.cartao_vermelho).length,
  } : { jogos: 0, gols: 0, assistencias: 0, mvp: 0, amarelos: 0, vermelhos: 0 };

  // Last 5 games
  const lastGames = performance?.playerStats 
    ? [...performance.playerStats]
        .sort((a, b) => new Date(b.resultado?.jogo?.data_hora).getTime() - new Date(a.resultado?.jogo?.data_hora).getTime())
        .slice(0, 5)
    : [];

  return (
    <Layout>
      <div className="min-h-screen bg-transparent text-foreground pb-20">
        <div className="container py-8 px-4 md:px-6">
          <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left">
            <FutGestorLogo 
              teamEscudo={team?.escudo_url} 
              showText={true} 
              size="lg" 
            />
            <p className="text-muted-foreground mt-2 font-medium">Gerencie suas informações pessoais e do clube</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar / Resumo */}
            <div className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="h-24 bg-primary/20 dark:bg-primary/30" />
                <CardContent className="px-6 pb-6 -mt-12 text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="h-24 w-24 border-4 border-card">
                      {fotoUrl ? (
                        <AvatarImage src={fotoUrl} alt="Foto do Jogador" />
                      ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <User className="h-12 w-12" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isAdmin && (
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-transparent border-border text-foreground backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle>Editar Informações do Atleta</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              {/* Photo Upload inside Dialog */}
                              <div className="flex flex-col items-center gap-2 mb-4">
                                <div className="relative">
                                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/50 bg-muted">
                                    {fotoUrl ? (
                                      <img src={fotoUrl} alt="Foto" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <User className="h-10 w-10 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <label htmlFor="photo-upload" className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-all">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                  </label>
                                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                                </div>
                              </div>

                              <FormField
                                control={form.control}
                                name="nome"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                      <Input className="bg-input border-border" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="apelido"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Apelido</FormLabel>
                                    <FormControl>
                                      <Input className="bg-input border-border" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="posicao"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Posição</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-input border-border">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-popover border-border text-popover-foreground">
                                        {Object.entries(positionLabels).map(([value, label]) => (
                                          <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button type="submit" className="w-full mt-4" disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{profile?.nome || user?.email}</h2>
                  <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                    {(profile as { tipo?: string })?.tipo || "Usuário"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{profile?.jogador_id ? statsSummary.gols : "-"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Gols</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{profile?.jogador_id ? statsSummary.assistencias : "-"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Assist.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400">Ativa</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tipo de Conta</span>
                    <span className="font-medium text-foreground uppercase text-[10px]">{isAdmin ? "Administrador" : "Atleta"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Membro desde</span>
                    <span className="font-medium text-foreground">
                      {profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR }) : "--"}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="pt-4 flex flex-col gap-3">
                <Button 
                   variant="outline" 
                   className="w-full"
                   onClick={() => navigate(basePath || "/")}
                >
                  🏠 Início
                </Button>
                <Button 
                   variant="ghost" 
                   className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                   onClick={signOut}
                >
                  Sair da conta
                </Button>
              </div>
            </div>

            {/* Configurações Principais */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="bg-muted/30 w-full justify-start p-1 rounded-xl mb-6 border border-white/5 backdrop-blur-md">
                  <TabsTrigger value="dados" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <UserCircle className="w-4 h-4" /> Perfil do Treinador
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="clube" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                      <Building2 className="w-4 h-4" /> Identidade do Clube
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="seguranca" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Shield className="w-4 h-4" /> Segurança
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-primary" /> Informações Básicas
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Seus dados como gestor da plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-muted-foreground">Nome Completo</Label>
                          <Input
                            id="nome"
                            value={form.watch("nome")}
                            onChange={(e) => form.setValue("nome", e.target.value)}
                            className="bg-black/20 border-white/10 text-foreground h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="bg-black/40 border-white/5 text-muted-foreground h-12"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telefone" className="text-muted-foreground">WhatsApp</Label>
                          <Input
                            id="telefone"
                            value={form.watch("telefone")}
                            onChange={(e) => form.setValue("telefone", e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="bg-black/20 border-white/10 text-foreground h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="posicao" className="text-muted-foreground">Cargo/Posição</Label>
                          <Select 
                            value={form.watch("posicao")} 
                            onValueChange={(val) => form.setValue("posicao", val as PlayerPosition)}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10 text-foreground h-12">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                              {Object.entries(positionLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={form.handleSubmit(onSubmit)} className="w-full h-12 font-bold uppercase tracking-wider" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="clube" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" /> Identidade Visual do Clube
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Como o seu time é visto publicamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-8">
                        <div className="relative group">
                          <Avatar className="h-32 w-32 border-2 border-primary/30 ring-4 ring-black/50">
                            <AvatarImage src={team?.escudo_url || ESCUDO_PADRAO} className="object-contain p-2" />
                            <AvatarFallback><Building2 className="w-12 h-12" /></AvatarFallback>
                          </Avatar>
                          <button 
                            onClick={() => escudoInputRef.current?.click()}
                            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {uploadingEscudo ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                          </button>
                          <input ref={escudoInputRef} type="file" accept="image/*" className="hidden" onChange={handleEscudoUpload} />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Nome do Clube</Label>
                            <Input 
                              value={teamNome} 
                              onChange={e => setTeamNome(e.target.value)} 
                              className="bg-black/20 border-white/10 h-12 font-bold text-lg"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Cidade</Label>
                              <Input value={cidade} onChange={e => setCidade(e.target.value)} className="bg-black/20 border-white/10 h-12" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">UF</Label>
                              <Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="bg-black/20 border-white/10 h-12 uppercase" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-semibold uppercase tracking-tighter text-primary">Redes Sociais</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" className="pl-10 bg-black/20 border-white/10 h-12" />
                          </div>
                          <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="YouTube URL" className="pl-10 bg-black/20 border-white/10 h-12" />
                          </div>
                          <div className="relative">
                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL" className="pl-10 bg-black/20 border-white/10 h-12" />
                          </div>
                          <div className="relative">
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Link do WhatsApp" className="pl-10 bg-black/20 border-white/10 h-12" />
                          </div>
                        </div>
                      </div>

                      <Button onClick={onSaveTeam} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black uppercase italic rounded-xl gap-2 shadow-lg shadow-primary/20" disabled={savingTeam}>
                        {savingTeam ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> ATUALIZAR IDENTIDADE DO CLUBE</>}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seguranca" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" /> Segurança da Conta
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Proteja o seu acesso ao painel tático.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="atual" className="text-muted-foreground">Senha Atual</Label>
                          <Input
                            id="atual"
                            type="password"
                            {...pwForm.register("atual")}
                            className="bg-black/20 border-white/10 text-foreground h-12"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nova" className="text-muted-foreground">Nova Senha</Label>
                            <Input
                              id="nova"
                              type="password"
                              {...pwForm.register("nova")}
                              className="bg-black/20 border-white/10 text-foreground h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmar" className="text-muted-foreground">Confirmar Nova Senha</Label>
                            <Input
                              id="confirmar"
                              type="password"
                              {...pwForm.register("confirmar")}
                              className="bg-black/20 border-white/10 text-foreground h-12"
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full h-12 font-bold uppercase tracking-wider" 
                        disabled={isUpdatingPassword}
                        onClick={pwForm.handleSubmit(onUpdatePassword)}
                      >
                        {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar Senha"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Fim do arquivo

