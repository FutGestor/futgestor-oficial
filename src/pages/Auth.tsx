import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, User } from "lucide-react";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "signup" ? "signup" : "login";
  });
  const [view, setView] = useState<"auth" | "forgot" | "reset">("auth");
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") === "true";
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { passwordRecovery, clearPasswordRecovery } = useAuth();

  // Detect recovery from auth context or URL param
  useEffect(() => {
    if (passwordRecovery || searchParams.get("type") === "recovery") {
      setView("reset");
    }

    if (searchParams.get("confirmed") === "true") {
      toast({
        title: "E-mail confirmado!",
        description: "Agora você pode entrar no painel.",
      });
    }
  }, [passwordRecovery, searchParams, toast]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Carregar dados salvos
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    
    if (savedEmail) {
      loginForm.setValue("email", savedEmail);
    }
    if (savedPassword) {
      loginForm.setValue("password", savedPassword);
    }
  }, [loginForm]);

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: "Email ou senha incorretos.",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            variant: "destructive",
            title: "Email não confirmado",
            description: "Por favor, confirme seu email antes de fazer login.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: error.message,
          });
        }
        return;
      }

      // Check user role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      const roles = userRoles?.map(r => r.role) || [];
      const isAdmin = roles.includes("admin") || roles.includes("super_admin");

      // Check if user has a team and is approved
      const { data: profile } = await supabase
        .from("profiles")
        .select("aprovado, team_id, jogador_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      // Fetch team slug for redirect
      let teamSlug = "";
      if (profile?.team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("slug")
          .eq("id", profile.team_id)
          .maybeSingle();
        teamSlug = teamData?.slug || "";
      }

      // Salvar dados baseado no checkbox
      if (rememberMe) {
        localStorage.setItem("savedEmail", data.email);
        localStorage.setItem("savedPassword", data.password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
        localStorage.removeItem("rememberMe");
      }

      // No team yet → redirect to onboarding to create one (only for admins/new users)
      if (!profile?.team_id && !profile?.jogador_id) {
        toast({
          title: "Bem-vindo!",
          description: "Crie seu time para começar.",
        });
        navigate("/onboarding");
        return;
      }

      const teamBase = teamSlug ? `/time/${teamSlug}` : "/";

      if (isAdmin) {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        navigate(teamBase);
      } else if (profile?.jogador_id) {
        // Player - redirect to team page (can navigate freely)
        toast({
          title: "Login realizado!",
          description: "Bem-vindo!",
        });
        navigate(teamBase);
      } else if (profile?.aprovado) {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        navigate(teamBase);
      } else {
        toast({
          title: "Aguardando aprovação",
          description: "Sua conta ainda não foi aprovada por um administrador.",
        });
        await supabase.auth.signOut();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: data.nome, // Nome será salvo via trigger handle_new_user
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: "Este email já está cadastrado. Tente fazer login.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: error.message,
          });
        }
        return;
      }

      // Check if auto-confirm is on (user gets session immediately)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        // Auto-confirmed: redirect to onboarding
        const redirectTo = searchParams.get("redirect");
        if (redirectTo === "onboarding") {
          navigate("/onboarding");
        } else {
          navigate("/onboarding");
        }
        toast({ title: "Cadastro realizado!", description: "Crie seu time para começar." });
        return;
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });
      
      signupForm.reset();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <FutGestorLogo className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl text-white italic font-black uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(5,96,179,0.5)]">
              FUT<span className="text-primary">GESTOR</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Acesse o painel do seu time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === "forgot" ? (
              <ForgotPasswordForm onBack={() => setView("auth")} />
            ) : view === "reset" ? (
              <ResetPasswordForm onSuccess={() => { clearPasswordRecovery(); setView("auth"); navigate("/auth"); }} />
            ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase italic text-xs transition-all">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase italic text-xs transition-all">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input
                                placeholder="seu@email.com"
                                className="pl-10 bg-black/40 border-white/10 text-white focus:border-primary/50"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input
                                type="password"
                                placeholder="••••••"
                                className="pl-10 bg-black/40 border-white/10 text-white focus:border-primary/50"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                      />
                      <label 
                        htmlFor="remember" 
                        className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors"
                      >
                        Lembrar email e senha
                      </label>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic shadow-[0_0_20px_rgba(5,96,179,0.4)] transition-all" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="w-full text-center text-sm text-primary hover:underline font-bold"
                    >
                      Esqueci minha senha
                    </button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">Nome completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input
                                placeholder="Seu nome completo"
                                className="pl-10 bg-black/40 border-white/10 text-white focus:border-primary/50"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input
                                placeholder="seu@email.com"
                                className="pl-10 bg-black/40 border-white/10 text-white focus:border-primary/50"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input
                                type="password"
                                placeholder="••••••"
                                className="pl-10 bg-black/40 border-white/10 text-white focus:border-primary/50"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic shadow-[0_0_20px_rgba(5,96,179,0.4)] transition-all" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cadastrar
                    </Button>
                  </form>
                </Form>
                <p className="mt-4 text-center text-sm text-slate-500 font-medium italic">
                  Após o cadastro, você poderá criar seu time imediatamente.
                </p>
              </TabsContent>
            </Tabs>
            )}

          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
