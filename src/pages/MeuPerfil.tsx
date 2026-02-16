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
      } finally {
        setIsLoadingJogador(false);
      }
    }
    if (profile) loadJogador();
  }, [profile, form]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}-${Date.now()}.${ext}`;
      await supabase.storage.from("jogadores").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("jogadores").getPublicUrl(path);
      setFotoUrl(publicUrl);
      toast({ title: "Foto enviada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
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
          foto_url: fotoUrl
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
        setJogador(nj);
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

  const handleEscudoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.team_id) return;
    setUploadingEscudo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.team_id}/escudo-${Date.now()}.${ext}`;
      await supabase.storage.from("times").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("times").getPublicUrl(path);
      await supabase.from("teams").update({ escudo_url: publicUrl }).eq("id", profile.team_id);
      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      toast({ title: "Escudo atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploadingEscudo(false);
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
            <Tabs defaultValue="dados">
              <TabsList className="bg-muted/30 w-full justify-start p-1 rounded-xl mb-6 border border-white/5 backdrop-blur-md overflow-x-auto h-auto no-scrollbar">
                <TabsTrigger value="dados" className="flex-1">Perfil</TabsTrigger>
                {isAdmin && <TabsTrigger value="clube" className="flex-1">Clube</TabsTrigger>}
                <TabsTrigger value="seguranca" className="flex-1">Segurança</TabsTrigger>
                <TabsTrigger value="conquistas" className="flex-1">Conquistas</TabsTrigger>
              </TabsList>

              <TabsContent value="dados"><BasicInfoForm form={form} user={user} isSaving={isSaving} onSubmit={onSubmit} /></TabsContent>
              {isAdmin && <TabsContent value="clube">
                <TeamIdentityForm 
                  team={team} teamNome={teamNome} setTeamNome={setTeamNome}
                  cidade={cidade} setCidade={setCidade} estado={estado} setEstado={setEstado}
                  instagram={instagram} setInstagram={setInstagram} youtube={youtube} setYoutube={setYoutube}
                  facebook={facebook} setFacebook={setFacebook} whatsapp={whatsapp} setWhatsapp={setWhatsapp}
                  onSaveTeam={onSaveTeam} savingTeam={savingTeam} uploadingEscudo={uploadingEscudo}
                  handleEscudoUpload={handleEscudoUpload} escudoInputRef={escudoInputRef}
                />
              </TabsContent>}
              <TabsContent value="seguranca"><SecurityForm pwForm={pwForm} isUpdatingPassword={isUpdatingPassword} onUpdatePassword={onUpdatePassword} /></TabsContent>
              <TabsContent value="conquistas"><AchievementsTab performance={performance} statsSummary={statsSummary} navigate={navigate} basePath={basePath} /></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Fim do arquivo

