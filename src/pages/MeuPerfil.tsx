import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { supabase } from "@/integrations/supabase/client";
import { positionLabels, type Jogador } from "@/lib/types";
import type { Database } from "@/integrations/supabase/types";
import { usePlayerPerformance } from "@/hooks/useEstatisticas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useQueryClient } from "@tanstack/react-query";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Subcomponents
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { BasicInfoForm } from "@/components/profile/BasicInfoForm";
import { TeamIdentityForm } from "@/components/profile/TeamIdentityForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { TeamFormStreak } from "@/components/TeamFormStreak";
import { TeamApprovalDonut } from "@/components/TeamApprovalDonut";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { usePlayerAchievements } from "@/hooks/useAchievements";
import { useResultados } from "@/hooks/useData";
import { Calendar, Trophy, BarChart3, Settings, ShieldCheck, ChevronRight, Star, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";

type PlayerPosition = Database["public"]["Enums"]["player_position"];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  apelido: z.string().optional(),
  posicao: z.enum(["goleiro", "zagueiro", "lateral", "volante", "meia", "atacante"]).optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  pe_preferido: z.enum(["destro", "canhoto", "ambos"]).nullable().optional(),
  peso_kg: z.string().optional(),
  altura_cm: z.string().optional(),
  bio: z.string().max(300).optional(),
  data_entrada: z.string().optional(),
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
  const year = new Date().getFullYear();
  
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [isLoadingJogador, setIsLoadingJogador] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { team } = useTeamConfig();
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

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropType, setCropType] = useState<"perfil" | "escudo" | null>(null);

  useEffect(() => {
    if (team && !teamNome) {
      setTeamNome(team.nome || "");
      setCidade(team.cidade || "");
      setEstado(team.estado || "");
      setInstagram(team.redes_sociais?.instagram || "");
      setYoutube(team.redes_sociais?.youtube || "");
      setFacebook(team.redes_sociais?.facebook || "");
      setWhatsapp(team.redes_sociais?.whatsapp || "");
    }
  }, [team, teamNome]);

  const { data: performance } = usePlayerPerformance(profile?.jogador_id || undefined, profile?.team_id || undefined);
  const { data: achievements } = usePlayerAchievements(profile?.jogador_id || undefined);
  const { data: resultados } = useResultados(profile?.team_id || undefined);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      apelido: "",
      posicao: "meia",
      telefone: "",
      email: "",
      pe_preferido: null,
      peso_kg: "",
      altura_cm: "",
      bio: "",
      data_entrada: "",
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

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isApproved) {
      toast({ title: "Acesso restrito", description: "Cadastro pendente de aprovação.", variant: "destructive" });
      navigate(basePath || "/");
    }
  }, [authLoading, user, isApproved, navigate, toast, basePath]);

  useEffect(() => {
    async function loadJogador() {
      if (!profile?.jogador_id) {
        if (profile?.nome) form.setValue("nome", profile.nome);
        setIsLoadingJogador(false);
        return;
      }
      try {
        const { data, error } = await supabase.from("jogadores").select("*").eq("id", profile.jogador_id).single();
        if (error) throw error;
        if (data) {
          setJogador(data as any);
          setFotoUrl(data.foto_url);
          form.reset({
            nome: data.nome,
            apelido: data.apelido || "",
            posicao: data.posicao as PlayerPosition,
            telefone: data.telefone || "",
            email: data.email || "",
            pe_preferido: data.pe_preferido || null,
            peso_kg: data.peso_kg?.toString() || "",
            altura_cm: data.altura_cm?.toString() || "",
            bio: data.bio || "",
            data_entrada: data.data_entrada || "",
          });
        }
      } catch (error) {
        console.error("Error loading jogador:", error);
      } finally {
        setIsLoadingJogador(false);
      }
    }
    if (profile) loadJogador();
  }, [profile, form]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType("perfil");
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleEscudoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType("escudo");
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = async (croppedBlob: Blob) => {
    if (!user || !cropType) return;
    setIsCropModalOpen(false);

    if (cropType === "perfil") {
      setIsUploading(true);
      try {
        const ext = "jpg";
        const path = `${user.id}-${Date.now()}.${ext}`;
        await supabase.storage.from("jogadores").upload(path, croppedBlob, { contentType: "image/jpeg" });
        const { data: { publicUrl } } = supabase.storage.from("jogadores").getPublicUrl(path);
        setFotoUrl(publicUrl);
        toast({ title: "Foto enviada!" });
      } catch (err: any) {
        toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    } else if (cropType === "escudo" && profile?.team_id) {
      setUploadingEscudo(true);
      try {
        const ext = "jpg";
        const path = `${profile.team_id}/escudo-${Date.now()}.${ext}`;
        await supabase.storage.from("times").upload(path, croppedBlob, { contentType: "image/jpeg" });
        const { data: { publicUrl } } = supabase.storage.from("times").getPublicUrl(path);
        await supabase.from("teams").update({ escudo_url: publicUrl }).eq("id", profile.team_id);
        queryClient.invalidateQueries({ queryKey: ["team-config"] });
        toast({ title: "Escudo atualizado!" });
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
        setUploadingEscudo(false);
      }
    }

    setTempImage(null);
    setCropType(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (jogador) {
        await supabase.from("jogadores").update({
          nome: data.nome,
          apelido: data.apelido || null,
          posicao: data.posicao,
          telefone: data.telefone || null,
          email: data.email || null,
          foto_url: fotoUrl,
          pe_preferido: data.pe_preferido || null,
          peso_kg: data.peso_kg ? parseFloat(data.peso_kg) : null,
          altura_cm: data.altura_cm ? parseInt(data.altura_cm) : null,
          bio: data.bio || null,
          data_entrada: data.data_entrada || null,
        }).eq("id", jogador.id);
        toast({ title: "Perfil atualizado!" });
      } else {
        const { data: nj, error: ie } = await supabase.from("jogadores").insert({
          nome: data.nome,
          posicao: data.posicao,
          foto_url: fotoUrl,
          user_id: user.id,
          team_id: profile?.team_id,
          ativo: true
        }).select().single();
        if (ie) throw ie;
        await supabase.from("profiles").update({ jogador_id: nj.id }).eq("id", user.id);
        setJogador(nj as any);
        await refreshProfile();
        toast({ title: "Perfil criado!" });
      }
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    if (!user?.email) return;
    setIsUpdatingPassword(true);
    try {
      const { error: se } = await supabase.auth.signInWithPassword({ email: user.email, password: data.atual });
      if (se) throw new Error("Senha atual incorreta.");
      await supabase.auth.updateUser({ password: data.nova });
      toast({ title: "Senha atualizada!" });
      pwForm.reset();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const onSaveTeam = async () => {
    if (!profile?.team_id) return;
    setSavingTeam(true);
    try {
      await supabase.from("teams").update({
        nome: teamNome.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        redes_sociais: { instagram, youtube, facebook, whatsapp }
      }).eq("id", profile.team_id);
      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      toast({ title: "Clube atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingTeam(false);
    }
  };


  if (authLoading || isLoadingJogador) {
    return <Layout><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div></Layout>;
  }

  const statsSummary = performance?.playerStats ? {
    jogos: performance.playerStats.filter(s => s.participou).length,
    gols: performance.playerStats.reduce((acc, s) => acc + (s.gols || 0), 0),
    assistencias: performance.playerStats.reduce((acc, s) => acc + (s.assistencias || 0), 0),
    mvp: performance.playerStats.filter(s => s.resultado?.mvp_jogador_id === profile?.jogador_id).length,
  } : { jogos: 0, gols: 0, assistencias: 0, mvp: 0 };

  const renderEditForm = () => (
    <DialogContent className="max-w-md bg-transparent border-border text-foreground backdrop-blur-xl">
      <DialogHeader><DialogTitle>Editar Informações do Atleta</DialogTitle></DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/50 bg-muted">
                {fotoUrl ? <img src={fotoUrl} alt="Foto" className="h-full w-full object-cover" /> : <User className="h-10 w-10" />}
              </div>
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </label>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
            </div>
          </div>
          <FormField control={form.control} name="nome" render={({ field }) => (
            <FormItem><FormControl><Input placeholder="Nome" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="posicao" render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(positionLabels).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </form>
      </Form>
    </DialogContent>
  );

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="mb-6 flex flex-col items-center md:items-start">
          <FutGestorLogo teamEscudo={team?.escudo_url} showText={true} size="md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ProfileSidebar 
            profile={profile} user={user} fotoUrl={fotoUrl} isAdmin={isAdmin} 
            statsSummary={statsSummary} signOut={signOut} navigate={navigate} basePath={basePath}
            isEditDialogOpen={isEditDialogOpen} setIsEditDialogOpen={setIsEditDialogOpen} 
            renderEditForm={renderEditForm}
          />

          <div className="lg:col-span-2">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="bg-muted/30 w-full justify-start p-1 rounded-xl mb-6 border border-white/5 backdrop-blur-md overflow-x-auto h-auto no-scrollbar">
                <TabsTrigger value="geral" className="flex-1 gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                  <span className="sm:hidden">Geral</span>
                </TabsTrigger>
                <TabsTrigger value="dados" className="flex-1 gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar Dados</span>
                  <span className="sm:hidden">Dados</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="clube" className="flex-1 gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Clube</span>
                    <span className="sm:hidden">Clube</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="seguranca" className="flex-1 gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Segurança</span>
                  <span className="sm:hidden">🔐</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero Card Premium */}
                <Card className="bg-black/60 backdrop-blur-3xl border-white/10 rounded-3xl overflow-hidden relative group transition-all hover:border-primary/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                  <CardContent className="p-8 relative">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        {/* Avatar e Badges */}
                        <div className="relative">
                          <Avatar className="h-32 w-32 border-4 border-primary/20 ring-4 ring-black/50">
                            {fotoUrl ? (
                              <AvatarImage src={fotoUrl} alt={profile?.nome} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                <User className="h-16 w-16" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {(profile as any)?.tipo === "atleta" && (
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-black italic uppercase">
                              Player
                            </div>
                          )}
                        </div>

                      <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                            {profile?.nome}
                          </h2>
                          <div className="flex items-center justify-center md:justify-start gap-4">
                            <span className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                              <Target className="h-3 w-3" />
                              {jogador?.posicao ? positionLabels[jogador.posicao as keyof typeof positionLabels] : "Atleta"}
                            </span>
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                              Membro desde {jogador?.data_entrada ? format(new Date(jogador.data_entrada), "MMM/yyyy", { locale: ptBR }) : (profile?.created_at ? format(new Date(profile.created_at), "MMM/yyyy", { locale: ptBR }) : "--")}
                            </span>
                          </div>
                        </div>

                        {/* Bio do Atleta */}
                        {jogador?.bio && (
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl md:max-w-md">
                            <p className="text-zinc-400 text-sm italic leading-relaxed">
                              "{jogador.bio}"
                            </p>
                          </div>
                        )}

                        {/* Dados Físicos Premium */}
                        {(jogador?.pe_preferido || jogador?.altura_cm || jogador?.peso_kg) && (
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {jogador.pe_preferido && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                <ShieldCheck className="h-3 w-3 text-primary/50" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Pé: <span className="text-white">{jogador.pe_preferido}</span></span>
                              </div>
                            )}
                            {jogador.altura_cm && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                <ShieldCheck className="h-3 w-3 text-primary/50" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Alt: <span className="text-white">{(jogador.altura_cm / 100).toFixed(2)} m</span></span>
                              </div>
                            )}
                            {jogador.peso_kg && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                <ShieldCheck className="h-3 w-3 text-primary/50" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Peso: <span className="text-white">{jogador.peso_kg}kg</span></span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-white/5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                              <Zap className="h-4 w-4" />
                              <span className="text-2xl font-black italic">{statsSummary.jogos}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Jogos</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-2xl font-black italic">{statsSummary.gols}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Gols</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white">
                              <span className="text-xs">🅰️</span>
                              <span className="text-2xl font-black italic">{statsSummary.assistencias}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Assists</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white">
                              <Trophy className="h-4 w-4 text-primary" />
                              <span className="text-2xl font-black italic">{statsSummary.mvp}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">MVPs</p>
                          </div>
                        </div>

                        {/* Achievement Progress Header */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Glória Geral</span>
                              <div className="flex gap-1">
                                {achievements?.filter(a => !!a.current_tier).slice(0, 4).map((a) => (
                                  <AchievementBadge 
                                    key={a.achievement_id} 
                                    slug={a.achievement.slug}
                                    tier={a.current_tier!}
                                    size="xs"
                                    showName={false}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs font-black italic text-primary">
                              {achievements?.filter(a => !!a.current_tier).length} / {achievements?.length} Concluidas
                            </span>
                          </div>
                          <Progress 
                            value={(achievements?.filter(a => !!a.current_tier).length || 0) / (achievements?.length || 1) * 100} 
                            className="h-1.5 bg-white/5"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Últimos 5 Jogos</p>
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <TeamFormStreak resultados={resultados || []} />
                      <p className="mt-4 text-[11px] font-bold text-zinc-500 italic">Sequência de Forma do Time</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-full flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Performance</p>
                        <Zap className="h-4 w-4 text-blue-500" />
                      </div>
                      <TeamApprovalDonut 
                        vitorias={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor > s.resultado?.gols_contra)).length || 0}
                        empates={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor === s.resultado?.gols_contra)).length || 0}
                        derrotas={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor < s.resultado?.gols_contra)).length || 0}
                      />
                      <p className="mt-2 text-xs font-black text-white italic uppercase tracking-tighter">Aproveitamento Pessoal</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden md:col-span-2 lg:col-span-1 border-dashed border-white/5 opacity-50">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-zinc-500">
                      <ShieldCheck className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Radar de Habilidades</p>
                      <p className="text-[9px] mt-1 italic">Em breve na Etapa 3</p>
                    </CardContent>
                  </Card>
                </div>

                  <ActivityCalendar jogadorId={profile?.jogador_id || ""} teamId={profile?.team_id || ""} year={year} />

                {/* Recent Achievements */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      ━━ Conquistas Recentes ━━
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`${basePath}/conquistas`)}
                      className="text-[10px] font-black uppercase italic text-primary hover:bg-primary/5 gap-1"
                    >
                      Ver Arena Completa <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                    {achievements?.filter(a => !!a.current_tier).map((a) => (
                      <Card 
                        key={a.achievement_id} 
                        className="bg-black/40 border-white/5 backdrop-blur-md hover:border-primary/20 transition-all cursor-pointer overflow-hidden group shrink-0 w-32 snap-start" 
                        onClick={() => navigate(`${basePath}/conquistas`)}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center">
                          <AchievementBadge 
                            slug={a.achievement.slug}
                            tier={a.current_tier!}
                            size="sm"
                          />
                          <p className="mt-2 text-[10px] font-black text-white line-clamp-1 uppercase tracking-tighter">
                            {a.achievement.name}
                          </p>
                          <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">
                            {a.unlocked_at ? format(new Date(a.unlocked_at), "dd/MM/yy", { locale: ptBR }) : "--"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dados" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BasicInfoForm form={form} user={user} isSaving={isSaving} onSubmit={onSubmit} />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="clube" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TeamIdentityForm 
                    team={team} teamNome={teamNome} setTeamNome={setTeamNome}
                    cidade={cidade} setCidade={setCidade} estado={estado} setEstado={setEstado}
                    instagram={instagram} setInstagram={setInstagram} youtube={youtube} setYoutube={setYoutube}
                    facebook={facebook} setFacebook={setFacebook} whatsapp={whatsapp} setWhatsapp={setWhatsapp}
                    onSaveTeam={onSaveTeam} savingTeam={savingTeam} uploadingEscudo={uploadingEscudo}
                    handleEscudoUpload={handleEscudoUpload} escudoInputRef={escudoInputRef}
                  />
                </TabsContent>
              )}

              <TabsContent value="seguranca" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SecurityForm pwForm={pwForm} isUpdatingPassword={isUpdatingPassword} onUpdatePassword={onUpdatePassword} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {tempImage && (
        <ImageCropperModal
          image={tempImage}
          isOpen={isCropModalOpen}
          onClose={() => {
            setIsCropModalOpen(false);
            setTempImage(null);
          }}
          onCropComplete={onCropComplete}
          aspect={1}
        />
      )}
    </Layout>
  );
}

// Fim do arquivo

