import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shield, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useSlugCheck } from "@/hooks/useSlugCheck";

const onboardingSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Cidade muito longa"),
  slug: z
    .string()
    .min(3, "Slug deve ter pelo menos 3 caracteres")
    .max(50, "Slug muito longo")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido. Use o formato 000.000.000-00"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

function generateSlug(nome: string, cidade: string): string {
  const combined = cidade ? `${nome}-${cidade}` : nome;
  return combined
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Onboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  const { team: existingTeam, isLoading: teamLoading } = useTeamConfig();

  useEffect(() => {
    if (profile?.team_id && existingTeam.slug) {
      navigate(`/time/${existingTeam.slug}`);
    }
  }, [profile, existingTeam.slug, navigate]);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { nome: "", cidade: "", slug: "", cpf: "" },
  });

  const currentSlug = form.watch("slug");
  const { isChecking, isAvailable, suggestions } = useSlugCheck(currentSlug);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const regenerateSlug = (nome?: string, cidade?: string) => {
    const n = nome ?? form.getValues("nome");
    const c = cidade ?? form.getValues("cidade");
    form.setValue("slug", generateSlug(n, c));
  };

  const handleSubmit = async (data: OnboardingFormData) => {
    if (isAvailable === false) {
      toast({ variant: "destructive", title: "Slug indisponível", description: "Escolha outro slug ou use uma das sugestões." });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Sessão expirada", description: "Faça login ou cadastre-se para continuar." });
      navigate("/auth?tab=signup&redirect=onboarding");
      return;
    }
    setIsLoading(true);

    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ nome: data.nome, slug: data.slug })
        .select()
        .single();

      // Store CPF in protected table
      if (team && data.cpf) {
        await supabase
          .from("team_sensitive_data")
          .insert({ team_id: team.id, cpf_responsavel: data.cpf });
      }

      if (teamError) {
        if (teamError.message.includes("unique")) {
          toast({ variant: "destructive", title: "Slug já em uso", description: "Escolha outro slug para seu time." });
          setIsLoading(false);
          return;
        }
        throw teamError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: team.id, aprovado: true })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: "admin" as const, team_id: team.id },
          { onConflict: "user_id,role" }
        );
      if (roleError) throw roleError;

      const { error: timeError } = await supabase
        .from("times")
        .insert({
          nome: data.nome,
          cidade: data.cidade,
          is_casa: true,
          ativo: true,
          team_id: team.id,
        });
      if (timeError) throw timeError;

      await refreshProfile();

      toast({ title: "Time criado!", description: "Agora escolha seu plano para começar." });
      navigate(`/time/${data.slug}/gestao`);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ variant: "destructive", title: "Erro ao criar time", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <FutGestorLogo className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Crie seu time</CardTitle>
          <CardDescription>
            Configure seu time para começar a usar o FutGestor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ex: FC Unidos"
                          className="pl-10"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            regenerateSlug(e.target.value, undefined);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade */}
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ex: Recife"
                          className="pl-10"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            regenerateSlug(undefined, e.target.value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="fc-unidos-recife" {...field} />
                        {currentSlug.length >= 3 && (
                          <div className="absolute right-3 top-2.5">
                            {isChecking ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : isAvailable === true ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : isAvailable === false ? (
                              <XCircle className="h-5 w-5 text-destructive" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      futgestor.app/time/{field.value || "slug"}
                    </p>
                    {isAvailable === false && (
                      <div className="space-y-1">
                        <p className="text-xs text-destructive font-medium">Slug já em uso. Sugestões:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => form.setValue("slug", s)}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => field.onChange(formatCpf(e.target.value))}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || isAvailable === false}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Time
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
