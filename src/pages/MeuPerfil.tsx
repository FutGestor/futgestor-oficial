import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera, Loader2 } from "lucide-react";
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
import { Trophy, Target, Shield, Zap, History, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PlayerPosition = Database["public"]["Enums"]["player_position"];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  apelido: z.string().optional(),
  posicao: z.enum(["goleiro", "zagueiro", "lateral", "volante", "meia", "atacante"]),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, isApproved, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const teamSlug = useOptionalTeamSlug();
  const basePath = teamSlug?.basePath || "";
  
  const [jogador, setJogador] = useState<any>(null);
  const [isLoadingJogador, setIsLoadingJogador] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    } catch (error: any) {
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
    } catch (error: any) {
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
      <div className="min-h-screen bg-slate-950 text-white pb-20">
        <div className="container max-w-4xl py-8 px-4 space-y-8">
          
          {/* Header Section - Identity */}
          <section className="flex flex-col items-center gap-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              {jogador && (
                <StickerCard 
                  jogador={jogador} 
                  stats={statsSummary}
                  variant={statsSummary.mvp > 5 ? "gold" : (statsSummary.gols > 10 ? "silver" : "bronze")}
                  className="scale-110 md:scale-125"
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                {jogador?.apelido || jogador?.nome || "Jogador"}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300 font-bold px-3 py-1">
                  #{jogador?.numero || "--"}
                </Badge>
                <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary font-bold px-3 py-1 uppercase tracking-wider">
                  {jogador?.posicao ? positionLabels[jogador.posicao as keyof typeof positionLabels] : "---"}
                </Badge>
              </div>
              
              {isAdmin && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 text-slate-400 hover:text-white hover:bg-white/5 gap-2 border border-white/5">
                      <Edit3 className="h-4 w-4" />
                      Editar Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-slate-900/95 border-white/10 text-white backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>Editar Informações do Atleta</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Photo Upload inside Dialog */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                          <div className="relative">
                            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/50 bg-slate-800">
                              {fotoUrl ? (
                                <img src={fotoUrl} alt="Foto" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <User className="h-10 w-10 text-slate-600" />
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
                                <Input className="bg-white/5 border-white/10" {...field} />
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
                                <Input className="bg-white/5 border-white/10" {...field} />
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
                                  <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
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
          </section>

          {/* Stats Grid - Bento Box Style */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <StatsCard label="Jogos" value={statsSummary.jogos} icon={<Zap className="h-5 w-5 text-yellow-500" />} />
            <StatsCard label="Gols" value={statsSummary.gols} icon={<Target className="h-5 w-5 text-primary" />} />
            <StatsCard label="Assists" value={statsSummary.assistencias} icon={<Target className="h-5 w-5 text-blue-500" />} />
            <StatsCard label="MVPs" value={statsSummary.mvp} icon={<Trophy className="h-5 w-5 text-orange-500" />} />
            <StatsCard label="Amarelos" value={statsSummary.amarelos} icon={<div className="h-5 w-4 bg-yellow-400 rounded-sm" />} />
            <StatsCard label="Vermelhos" value={statsSummary.vermelhos} icon={<div className="h-5 w-4 bg-red-600 rounded-sm" />} />
          </section>

          {/* Timeline - Last Games */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <h2 className="text-xl font-bold flex items-center gap-2 px-1">
              <History className="h-5 w-5 text-primary" />
              Histórico Recente
            </h2>
            
            <div className="space-y-3">
              {lastGames.length > 0 ? lastGames.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 uppercase tracking-tighter">
                      {stat.resultado?.jogo?.data_hora 
                        ? format(new Date(stat.resultado.jogo.data_hora), "dd 'de' MMMM", { locale: ptBR })
                        : "Partida Antiga"}
                    </span>
                    <span className="text-xs text-slate-400">Participação Confirmada</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-1 rounded-md text-xs font-bold">
                      <Target className="h-3 w-3" />
                      {stat.gols || 0} G
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md text-xs font-bold">
                       <Zap className="h-3 w-3" />
                      {stat.assistencias || 0} A
                    </div>
                    {stat.resultado?.mvp_jogador_id === profile?.jogador_id && (
                      <Trophy className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02]">
                  <p className="text-slate-500 font-medium">Nenhum histórico disponível nesta temporada.</p>
                </div>
              )}
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
             <Button 
                variant="outline" 
                className="w-full bg-white/5 border-white/10 hover:bg-white/10"
                onClick={() => navigate(basePath || "/")}
             >
               🏠 Voltar para o Início
             </Button>
            <Button 
               variant="ghost" 
               className="text-red-400 hover:text-red-300 hover:bg-red-900/10"
               onClick={signOut}
            >
              Sair da minha conta
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function StatsCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-4 flex flex-col gap-2 transition-all hover:bg-slate-900 shadow-2xl">
      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:rotate-12 translate-x-2 -translate-y-2">
        {icon}
      </div>
      <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</span>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>
  );
}
