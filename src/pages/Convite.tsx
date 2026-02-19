import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Mail, Lock, ShieldCheck, Camera, ChevronRight } from "lucide-react";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { positionLabels, PlayerPosition } from "@/lib/types";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { TeamShield } from "@/components/TeamShield";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";

const conviteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  posicao: z.string().min(1, "Selecione sua posição"),
});

type ConviteFormData = z.infer<typeof conviteSchema>;

export default function Convite() {
  const { code } = useParams<{ code: string }>();
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamData, setTeamData] = useState<{ id: string; nome: string; slug: string; escudo_url: string | null } | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  const form = useForm<ConviteFormData>({
    resolver: zodResolver(conviteSchema),
    defaultValues: { 
      nome: profile?.nome || user?.user_metadata?.nome || "", 
      email: user?.email || "", 
      password: "", 
      posicao: "atacante" 
    },
  });

  useEffect(() => {
    if (profile?.nome) form.setValue("nome", profile.nome);
    if (user?.email) form.setValue("email", user.email);
  }, [profile, user, form]);


  useEffect(() => {
    async function fetchTeam() {
      if (!code || code === "undefined") {
        setIsLoadingCode(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("id, nome, slug, escudo_url")
          .eq("invite_code", code)
          .maybeSingle();

        if (error) {
          if (error.code === "PGRST204" || error.message?.includes("invite_code")) {
            throw new Error("O sistema de convites ainda não foi configurado no banco de dados.");
          }
          throw error;
        }

        if (!data) {
          toast({
            variant: "destructive",
            title: "Convite inválido",
            description: "Este código de convite não existe ou expirou.",
          });
          navigate("/");
          return;
        }
        setTeamData(data);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Erro ao buscar time:", error);
        toast({ 
          variant: "destructive", 
          title: "Erro de Configuração", 
          description: error.message || "Falha ao validar convite. Verifique se a migração SQL foi executada." 
        });
      } finally {
        setIsLoadingCode(false);
      }
    }
    fetchTeam();
  }, [code, navigate, toast]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFoto = async (userId: string): Promise<string | null> => {
    if (!fotoFile) return null;

    const fileExt = fotoFile.name.split('.').pop();
    const filePath = `${userId}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('jogadores')
      .upload(filePath, fotoFile);

    if (uploadError) {
      console.error("Erro no upload da foto:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('jogadores')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: ConviteFormData) => {
    if (!teamData) return;
    setIsSubmitting(true);

    try {
      let userId = user?.id;
      let isConfirmed = !!user;

      // 1. Se NÃO estiver logado, faz SignUp
      if (!userId) {
        if (!data.email || !data.password) {
          throw new Error("E-mail e senha são obrigatórios para novos usuários.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nome: data.nome,
              team_id: teamData.id,
              posicao: data.posicao,
              form_type: 'invite_link'
            },
            emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          },
        });

        if (authError) {
          if (authError.message.includes("security purposes")) {
            throw new Error("Muitas tentativas. Por favor, aguarde 60 segundos antes de tentar novamente.");
          }
          throw authError;
        }
        
        if (!authData.user) throw new Error("Falha ao criar usuário");
        userId = authData.user.id;
        isConfirmed = !!authData.session;
      }

      if (isConfirmed && userId) {
        let jogadorIdFinal = null;
        const basePath = teamData ? `/time/${teamData.slug}` : "";
        // 2. Se logado ou autoconfirmado, vincula o jogador
        let uploadedFotoUrl = null;
        if (fotoFile) {
          uploadedFotoUrl = await uploadFoto(userId);
        }

        try {
          // Aguarda um pequeno instante para o trigger completar (se foi signup novo)
          if (!user) await new Promise(resolve => setTimeout(resolve, 500));

          // Busca o perfil
          const { data: profileData } = await supabase
            .from("profiles")
            .select("jogador_id")
            .eq("id", userId)
            .maybeSingle();

          if (profileData?.jogador_id) {
            // Atualiza o jogador existente
            await supabase
              .from("jogadores")
              .update({ 
                foto_url: uploadedFotoUrl,
                posicao: data.posicao as PlayerPosition,
                team_id: teamData.id // Garante que vincula ao time do convite
              })
              .eq("id", profileData.jogador_id);

            // Garante que o perfil está aprovado e vinculado ao time ao usar convite válido
            await supabase
              .from("profiles")
              .update({ 
                aprovado: true,
                team_id: teamData.id 
              })
              .eq("id", userId);
          } else {
            // Cria novo jogador e vincula ao perfil
            const { data: newJogador } = await supabase
              .from("jogadores")
              .insert({
                nome: data.nome,
                email: data.email || user?.email || "",
                team_id: teamData.id,
                user_id: userId,
                posicao: data.posicao as PlayerPosition,
                foto_url: uploadedFotoUrl,
                ativo: true,
              })
              .select()
              .single();

            if (newJogador) {
              await supabase
                .from("profiles")
                .update({ 
                  jogador_id: newJogador.id,
                  nome: data.nome, // Atualiza o nome no perfil também
                  aprovado: true, // Auto-aprovação ao usar convite válido
                  team_id: teamData.id // Vincula o perfil ao time
                })
                .eq("id", userId);
              jogadorIdFinal = newJogador.id;
            }
          }
        } catch (dbErr) {
          console.warn("Erro ao vincular dados:", dbErr);
        }
        
        // Notificar administradores sobre o novo jogador
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('notify_team', {
            p_team_id: teamData.id,
            p_tipo: 'novo_jogador',
            p_titulo: '👥 Novo jogador no time!',
            p_mensagem: `${data.nome} entrou para o elenco via convite`,
            p_link: `${basePath}/meu-perfil?view=${jogadorIdFinal || userId}`
          });
        } catch (notifError) {
          console.warn('Falha ao enviar notificação de novo jogador:', notifError);
        }

        // Atualiza o estado global de autenticação/perfil para garantir que as rotas reconheçam o novo time
        await refreshProfile();
        
        toast({
          title: "Bem-vindo!",
          description: `Você entrou com sucesso no ${teamData.nome}.`,
        });
        
        // Navega diretamente para o dashboard do time para evitar loops de redirecionamento no Auth.tsx
        navigate(`/time/${teamData.slug}`);
      } else {
        toast({
          title: "Quase lá!",
          description: "Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para entrar no time.",
        });
        if (!user) form.reset();
        setFotoFile(null);
        setFotoPreview(null);
      }

    } catch (err: unknown) {
      const error = err as Error;
      console.error("Erro no cadastro via convite:", error);
      toast({
        variant: "destructive",
        title: "Erro ao entrar no time",
        description: error.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <TeamShield 
                escudoUrl={teamData?.escudo_url || null} 
                teamName={teamData?.nome || "Clube"} 
                size="xl" 
              />
            </div>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
              CADASTRAR NO <span className="text-[#0560B3]">{teamData?.nome}</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Complete seu cadastro para se juntar ao elenco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('foto-upload')?.click()}>
                    <div className={`h-24 w-24 rounded-full border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center bg-black/40 transition-all group-hover:border-[#0560B3] ${fotoPreview ? 'border-solid border-[#0560B3]' : ''}`}>
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-slate-500 group-hover:text-[#0560B3]" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#0560B3] p-1.5 rounded-full text-black shadow-lg">
                      <Camera className="h-4 w-4" />
                    </div>
                    <input 
                      id="foto-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFotoChange} 
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase italic text-slate-500">Clique para adicionar sua foto</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Nome/Apelido</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-primary" />
                            <Input 
                              placeholder="Seu apelido" 
                              title="Nome ou Apelido"
                              className="bg-black/40 border-white/10 text-white pl-10 focus:border-primary/50" 
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Posição</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white focus:border-primary/50">
                              <SelectValue placeholder="Sua posição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            {Object.entries(positionLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value} className="focus:bg-primary focus:text-white">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!user && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">E-mail</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input type="email" placeholder="seu@email.com" className="bg-black/40 border-white/10 text-white pl-10 focus:border-primary/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input type="password" placeholder="••••••••" className="bg-black/40 border-white/10 text-white pl-10 focus:border-primary/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Button type="submit" className="w-full h-14 text-lg font-black uppercase italic bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_0_20px_rgba(5,96,179,0.35)]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      CONFIRMAR E ENTRAR
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
