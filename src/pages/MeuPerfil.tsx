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
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { supabase } from "@/integrations/supabase/client";
import { positionLabels } from "@/lib/types";
import type { Database } from "@/integrations/supabase/types";
import { MeuPlanoSection } from "@/components/MeuPlanoSection";

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
  const { user, profile, isApproved, isLoading: authLoading, refreshProfile } = useAuth();
  const { basePath } = useTeamSlug();
  
  const [jogador, setJogador] = useState<any>(null);
  const [isLoadingJogador, setIsLoadingJogador] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

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
      navigate(basePath);
    }
  }, [authLoading, user, isApproved, navigate, toast]);

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

  return (
    <Layout>
      <div className="container max-w-2xl py-8 px-4 md:px-6 space-y-6">
        {/* Seção Meu Plano */}
        <MeuPlanoSection />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil de Jogador
            </CardTitle>
            <CardDescription>
              {jogador 
                ? "Atualize suas informações de atleta"
                : "Preencha seu perfil para aparecer na galeria de jogadores"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20 bg-muted">
                      {fotoUrl ? (
                        <img
                          src={fotoUrl}
                          alt="Sua foto"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique no ícone para enviar sua foto
                  </p>
                </div>

                {/* Número (read-only if exists) */}
                {jogador?.numero && (
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      Camisa #{jogador.numero}
                    </Badge>
                    <span className="text-sm text-muted-foreground">(definido pelo admin)</span>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
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
                        <Input placeholder="Como você é conhecido" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional - será exibido na galeria de jogadores
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="posicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua posição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(positionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional - para contato interno do time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional - para comunicados do time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : jogador ? (
                    "Atualizar Perfil"
                  ) : (
                    "Criar Perfil"
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
