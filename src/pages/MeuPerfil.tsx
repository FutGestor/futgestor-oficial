import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, User, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { TeamShield } from "@/components/TeamShield";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

// Subcomponents
import { BasicInfoForm } from "@/components/profile/BasicInfoForm";
import { TeamIdentityForm } from "@/components/profile/TeamIdentityForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { TeamFormStreak } from "@/components/TeamFormStreak";
import { TeamApprovalDonut } from "@/components/TeamApprovalDonut";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { AchievementDetailsModal } from "@/components/achievements/AchievementDetailsModal";
import { usePlayerAchievements } from "@/hooks/useAchievements";
import { useResultados } from "@/hooks/useData";
import { Calendar, Trophy, BarChart3, Settings, ShieldCheck, ChevronRight, Star, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

type PlayerPosition = Database["public"]["Enums"]["player_position"];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  apelido: z.string().optional(),
  posicao: z.enum(["goleiro", "zagueiro", "lateral", "volante", "meia", "atacante"]).optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  pe_preferido: z.string().nullable().optional(),
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
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get("view");
  const { user, profile, isAdmin, isApproved, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const isExternalView = !!viewId && viewId !== profile?.jogador_id && viewId !== user?.id;
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
  const [bio, setBio] = useState("");
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
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
  const shouldResyncTeam = useRef(true);

  useEffect(() => {
    if (team && shouldResyncTeam.current) {
      setTeamNome(team.nome || "");
      setCidade(team.cidade || "");
      setEstado(team.estado || "");
      setBio((team as any).bio || "");
      setInstagram(team.redes_sociais?.instagram || "");
      setYoutube(team.redes_sociais?.youtube || "");
      setFacebook(team.redes_sociais?.facebook || "");
      setWhatsapp(team.redes_sociais?.whatsapp || "");
      shouldResyncTeam.current = false;
    }
  }, [team]);

  const { data: performance } = usePlayerPerformance(jogador?.id || undefined, jogador?.team_id || profile?.team_id || undefined);
  const { data: achievements } = usePlayerAchievements(jogador?.id || undefined);
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
      // Don't redirect immediately on refresh if profile is still loading or just loaded
      // toast remains for feedback but navigation is removed to prevent F5 lock-out
      console.warn("User not approved yet");
    }
  }, [authLoading, user, isApproved, navigate, toast, basePath]);

  useEffect(() => {
    async function loadJogador() {
      const targetId = viewId || profile?.jogador_id;
      
      if (!targetId) {
        if (profile?.nome) form.setValue("nome", profile.nome);
        setIsLoadingJogador(false);
        return;
      }

      setIsLoadingJogador(true);
      try {
        const { data, error } = await supabase.from("jogadores").select("*").eq("id", targetId).single();
        if (error) {
          // Fallback if not found by ID, try by user_id
          const { data: dataByUser, error: errorUser } = await supabase.from("jogadores").select("*").eq("user_id", targetId).maybeSingle();
          if (errorUser || !dataByUser) throw error;
          
          setJogador(dataByUser as unknown as Jogador);
          setFotoUrl(dataByUser.foto_url);
          const d = dataByUser as any;
          form.reset({
            nome: dataByUser.nome,
            apelido: dataByUser.apelido || "",
            posicao: dataByUser.posicao as PlayerPosition,
            telefone: dataByUser.telefone || "",
            email: dataByUser.email || "",
            pe_preferido: d.pe_preferido || null,
            peso_kg: d.peso_kg ? String(d.peso_kg) : "",
            altura_cm: d.altura_cm ? String(d.altura_cm) : "",
            bio: d.bio || "",
            data_entrada: d.data_entrada || "",
          });
          return;
        }

        if (data) {
          setJogador(data as unknown as Jogador);
          setFotoUrl(data.foto_url);
          const d = data as any;
          form.reset({
            nome: data.nome,
            apelido: data.apelido || "",
            posicao: data.posicao as PlayerPosition,
            telefone: data.telefone || "",
            email: data.email || "",
            pe_preferido: d.pe_preferido || null,
            peso_kg: d.peso_kg ? String(d.peso_kg) : "",
            altura_cm: d.altura_cm ? String(d.altura_cm) : "",
            bio: d.bio || "",
            data_entrada: d.data_entrada || "",
          });
        }
      } catch (error) {
        console.error("Error loading jogador:", error);
      } finally {
        setIsLoadingJogador(false);
      }
    }
    if (profile || viewId) loadJogador();
  }, [profile, viewId, form]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const inputRef = event.target;
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType("perfil");
      setIsCropModalOpen(true);
      inputRef.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleEscudoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputRef = e.target;
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType("escudo");
      setIsCropModalOpen(true);
      inputRef.value = "";
    };
    reader.readAsDataURL(file);
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
        
        // Se o jogador já existe, salvar no banco imediatamente para atualização automática
        if (jogador?.id) {
          await supabase.from("jogadores").update({ foto_url: publicUrl }).eq("id", jogador.id);
          await refreshProfile();
          queryClient.invalidateQueries({ queryKey: ["jogador"] });
        }

        toast({ title: "Foto enviada!" });
      } catch (err: any) {
        const error = err as Error;
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
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
        
        // Sincronizar escudo no registro "time da casa" na tabela times
        await supabase
          .from("times")
          .update({ escudo_url: publicUrl })
          .eq("team_id", profile.team_id)
          .eq("is_casa", true);
        
        // Invalidar cache de times após sync
        queryClient.invalidateQueries({ queryKey: ["times"] });
        
        // Update query cache instantly
        queryClient.setQueryData(["team-config", profile.team_id], (old: any) => ({ ...old, escudo_url: publicUrl }));
        if (teamSlug?.slug) {
          queryClient.invalidateQueries({ queryKey: ["team-by-slug", teamSlug.slug] });
        }
        
        shouldResyncTeam.current = true;
        await queryClient.invalidateQueries({ queryKey: ["team-config"] });
        await refreshProfile();
        toast({ title: "Escudo atualizado!" });
      } catch (err: any) {
        const error = err as Error;
        toast({ title: "Erro", description: error.message, variant: "destructive" });
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
      // Always update profiles.nome
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nome: data.nome })
        .eq("id", user.id);
      
      if (profileError) {
        console.error("Error updating profile nome:", profileError);
      }

      if (jogador) {
        const updateData = {
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
        };
        const { error: jogadorError } = await supabase.from("jogadores")
          .update(updateData)
          .eq("id", jogador.id);
        
        if (jogadorError) throw jogadorError;
        
        // Update local state immediately so UI reflects changes
        setJogador({ ...jogador, ...updateData } as unknown as Jogador);
        
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["jogador"] });
        
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
        setJogador(nj as unknown as Jogador);
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["jogador"] });
        toast({ title: "Perfil criado!" });
      }
      setIsEditDialogOpen(false);
    } catch (err: any) {
      const error = err as Error;
      console.error("Save error:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
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
        bio: bio.trim(),
        redes_sociais: { instagram, youtube, facebook, whatsapp }
      } as any).eq("id", profile.team_id);

      // Sincronizar o registro "time da casa" na tabela times
      await supabase
        .from("times")
        .update({ nome: teamNome.trim() })
        .eq("team_id", profile.team_id)
        .eq("is_casa", true);
      
      // Invalidar cache de times após sync
      queryClient.invalidateQueries({ queryKey: ["times"] });

      // Update query cache instantly
      queryClient.setQueryData(["team-config", profile.team_id], (old: any) => ({
        ...old,
        nome: teamNome.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        redes_sociais: { instagram, youtube, facebook, whatsapp }
      }));

      if (teamSlug?.slug) {
        queryClient.invalidateQueries({ queryKey: ["team-by-slug", teamSlug.slug] });
      }

      shouldResyncTeam.current = true;
      await queryClient.invalidateQueries({ queryKey: ["team-config"] });
      await refreshProfile();
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
    mvp: performance.playerStats.filter(s => s.resultado?.mvp_jogador_id === jogador?.id).length,
    media: performance.playerStats.filter(s => s.participou).length > 0 
      ? (performance.playerStats.reduce((acc, s) => acc + (s.gols || 0), 0) / performance.playerStats.filter(s => s.participou).length).toFixed(2)
      : "0.00"
  } : { jogos: 0, gols: 0, assistencias: 0, mvp: 0, media: "0.00" };

  const renderEditForm = () => (
    <DialogContent className="max-w-md bg-transparent border-border text-foreground backdrop-blur-xl" onCloseAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Editar Informações do Atleta</DialogTitle>
        <DialogDescription>
          Atualize seus dados pessoais e foto de perfil.
        </DialogDescription>
      </DialogHeader>
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
        <div className="mb-8 flex flex-col items-center md:items-start">
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <TeamShield 
              escudoUrl={team?.escudo_url} 
              teamName={team?.nome || "Meu Clube"} 
              size="lg" 
              className="border-primary/20 shadow-primary/10"
            />
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {team?.nome || "Meu Clube"}
            </h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="bg-muted/30 w-full justify-start p-1 rounded-xl mb-6 border border-white/5 backdrop-blur-md overflow-x-auto h-auto no-scrollbar">
                <TabsTrigger value="geral" className="flex-1 gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                  <span className="sm:hidden">Geral</span>
                </TabsTrigger>
                
                {!isExternalView && (
                  <TabsTrigger value="dados" className="flex-1 gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar Dados</span>
                    <span className="sm:hidden">Dados</span>
                  </TabsTrigger>
                )}

                {isAdmin && !isExternalView && (
                  <TabsTrigger value="clube" className="flex-1 gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Clube</span>
                    <span className="sm:hidden">Clube</span>
                  </TabsTrigger>
                )}

                {!isExternalView && (
                  <TabsTrigger value="seguranca" className="flex-1 gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Segurança</span>
                    <span className="sm:hidden">🔐</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="geral" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* BLOCO 1 — Hero Card Premium */}
                <Card className="bg-gradient-to-br from-black/80 via-black/60 to-primary/10 backdrop-blur-3xl border-white/10 rounded-2xl overflow-hidden relative group transition-all hover:border-primary/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40" />
                  <CardContent className="p-6 md:p-8 relative">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                      {/* Avatar Premium com Glow */}
                      <div className="relative group/avatar">
                        <Avatar className="h-40 w-40 border-4 border-primary/20 ring-4 ring-black/50 overflow-hidden shadow-[0_0_30px_rgba(5,96,179,0.3)]">
                          {fotoUrl ? (
                            <AvatarImage src={fotoUrl} alt={jogador?.nome || profile?.nome} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-muted text-muted-foreground uppercase">
                              {(jogador?.nome || profile?.nome)?.substring(0, 2) || <User className="h-20 w-20" />}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        {!isExternalView && (
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="icon" className="absolute top-0 right-0 h-8 w-8 rounded-full bg-primary/80 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            {renderEditForm()}
                          </Dialog>
                        )}
                        
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 whitespace-nowrap">
                           <Target className="h-3 w-3 text-primary" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                             {jogador?.posicao ? positionLabels[jogador.posicao as keyof typeof positionLabels] : "Atleta"}
                           </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none drop-shadow-lg">
                              {jogador?.apelido || profile?.nome}
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                              <span className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {jogador?.data_entrada ? format(new Date(jogador.data_entrada), "MMM/yyyy", { locale: ptBR }).toUpperCase() : "MEMBRO"}
                              </span>
                              {jogador?.bio && (
                                <span className="hidden md:inline-block text-zinc-500 italic text-sm">
                                  "{jogador.bio}"
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5"
                              onClick={() => navigate(basePath || "/")}
                            >
                                <ChevronRight className="h-3 w-3 rotate-180 mr-1" />
                                Início
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-3 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={isExternalView ? () => navigate(-1) : signOut}
                            >
                                {isExternalView ? "Voltar" : "Sair"}
                            </Button>
                          </div>
                        </div>

                        {/* Grid de Stats Premium */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-white/5">
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-3xl md:text-4xl font-black italic text-white leading-none">{statsSummary.jogos}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">Jogos</span>
                          </div>
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-3xl md:text-4xl font-black italic text-amber-400 leading-none">{statsSummary.gols}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">Gols</span>
                          </div>
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-3xl md:text-4xl font-black italic text-cyan-400 leading-none">{statsSummary.assistencias}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">Assists</span>
                          </div>
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-3xl md:text-4xl font-black italic text-purple-400 leading-none">{statsSummary.mvp}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">MVPs</span>
                          </div>
                        </div>

                        {/* Média e Progresso */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                           <div className="flex items-center gap-3">
                              <BarChart3 className="h-5 w-5 text-primary" />
                              <div className="flex flex-col">
                                 <span className="text-xl font-black italic text-white leading-none">{statsSummary.media}</span>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Média de Gols</span>
                              </div>
                           </div>
                           
                           <div className="flex-1 w-full space-y-2">
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                 <span className="text-zinc-400">Progresso de Glória</span>
                                 <span className="text-primary italic">{achievements?.filter(a => !!a.current_tier).length} / {achievements?.length} Concluídas</span>
                              </div>
                              <Progress 
                                value={(achievements?.filter(a => !!a.current_tier).length || 0) / (achievements?.length || 1) * 100} 
                                className="h-2 bg-white/5 overflow-hidden"
                              />
                           </div>

                           <div className="flex flex-wrap items-center justify-center gap-3">
                              {jogador?.pe_preferido && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/5">
                                  <span className="text-[9px] font-black uppercase text-zinc-500">Pé: <span className="text-white">{jogador.pe_preferido}</span></span>
                                </div>
                              )}
                              {jogador?.altura_cm && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/5">
                                  <span className="text-[9px] font-black uppercase text-zinc-500">Alt: <span className="text-white">{(jogador.altura_cm / 100).toFixed(2)}m</span></span>
                                </div>
                              )}
                              {jogador?.peso_kg && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/5">
                                  <span className="text-[9px] font-black uppercase text-zinc-500">Peso: <span className="text-white">{jogador.peso_kg}kg</span></span>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* BLOCO 2 — Grid de Métricas Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Widget: Últimos 5 Jogos */}
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Últimos 5 Jogos</p>
                          <h3 className="text-xs font-bold text-zinc-400 italic">Sequência de Forma</h3>
                       </div>
                       <BarChart3 className="h-4 w-4 text-primary/50" />
                    </div>
                    <div className="flex justify-center">
                       <TeamFormStreak resultados={resultados || []} />
                    </div>
                  </Card>

                  {/* Widget: Performance */}
                  <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden group hover:border-primary/20 transition-all rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Performance</p>
                          <h3 className="text-xs font-bold text-zinc-400 italic">Aproveitamento Pessoal</h3>
                       </div>
                       <Zap className="h-4 w-4 text-blue-500/50" />
                    </div>
                    <div className="flex justify-center items-center py-2">
                       <TeamApprovalDonut 
                         vitorias={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor > s.resultado?.gols_contra)).length || 0}
                         empates={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor === s.resultado?.gols_contra)).length || 0}
                         derrotas={performance?.playerStats?.filter(s => s.participou && (s.resultado?.gols_favor < s.resultado?.gols_contra)).length || 0}
                         size={140}
                       />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* BLOCO 4 — Quadro de Atividade */}
                  <div className="lg:col-span-2">
                    <div className="bg-black/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Quadro de Atividade</p>
                          <h3 className="text-xs font-bold text-zinc-400 italic">Frequência em Campo</h3>
                        </div>
                        <Calendar className="h-4 w-4 text-zinc-600" />
                      </div>
                        <ActivityCalendar jogadorId={jogador?.id || ""} teamId={jogador?.team_id || profile?.team_id || ""} year={year} />
                    </div>
                  </div>

                  {/* BLOCO 5 — Conquistas Recentes */}
                  <div className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Conquistas Recentes</p>
                          <h3 className="text-xs font-bold text-zinc-400 italic">Últimos Troféus</h3>
                        </div>
                        <Trophy className="h-4 w-4 text-amber-500/50" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {achievements?.filter(a => !!a.current_tier).slice(0, 4).map((a) => (
                          <div 
                            key={a.achievement_id} 
                            className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center animate-in zoom-in-50 duration-500 cursor-pointer hover:bg-white/10 hover:border-primary/30 active:scale-95 transition-all"
                            onClick={() => {
                              setSelectedAchievement(a);
                              setIsAchievementModalOpen(true);
                            }}
                          >
                            <AchievementBadge 
                              slug={a.achievement.slug}
                              tier={a.current_tier!}
                              size="sm"
                            />
                            <p className="mt-2 text-[9px] font-black text-white line-clamp-1 uppercase tracking-tighter">
                              {a.achievement.name}
                            </p>
                          </div>
                        ))}
                        {(!achievements || achievements.filter(a => !!a.current_tier).length === 0) && (
                           <div className="col-span-2 py-8 flex flex-col items-center justify-center opacity-30">
                              <Trophy className="h-8 w-8 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Jogue para liberar!</p>
                           </div>
                        )}
                      </div>

                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => navigate(`${basePath}/conquistas`)}
                        className="w-full mt-6 text-[10px] font-black uppercase italic text-primary hover:no-underline hover:text-white transition-colors"
                      >
                        Ver Arena Completa <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Card>
                  </div>
                </div>

                <AchievementDetailsModal 
                  playerAchievement={selectedAchievement}
                  isOpen={isAchievementModalOpen}
                  onOpenChange={setIsAchievementModalOpen}
                />
              </TabsContent>

              <TabsContent value="dados" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BasicInfoForm form={form} user={user} isSaving={isSaving} onSubmit={onSubmit} />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="clube" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TeamIdentityForm 
                    team={team} teamNome={teamNome} setTeamNome={setTeamNome}
                    cidade={cidade} setCidade={setCidade} estado={estado} setEstado={setEstado}
                    bio={bio} setBio={setBio}
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

