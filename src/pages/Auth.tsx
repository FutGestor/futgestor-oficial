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
import { LoadingScreen } from "@/components/LoadingScreen";

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
  const { user, profile, isAdmin, isLoading: authLoading, passwordRecovery, clearPasswordRecovery } = useAuth();

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

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. Limpeza agressiva de qualquer resíduo de sessão no localStorage
      // Procura por chaves que começam com 'sb-' (padrão do Supabase)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // 2. Logout formal no Supabase
      await supabase.auth.signOut();

      // 3. Pequeno delay para garantir que o estado interno do Supabase e o browser 
      // processem a limpeza antes do redirecionamento
      await new Promise(resolve => setTimeout(resolve, 500));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Erro Google Login:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível conectar com o Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determina o destino do usuário ANTES de navegar
  const determineDestination = async (userId: string) => {
    // 1. Buscar profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("team_id, jogador_id")
      .eq("id", userId)
      .maybeSingle();
    
    // 2. Se tem team_id → ir para o time
    if (prof?.team_id) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("slug")
        .eq("id", prof.team_id)
        .maybeSingle();
      
      if (teamData?.slug) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("team_id", prof.team_id);
          
        const roles = userRoles?.map(r => r.role as string) || [];
        const isAdmin = roles.includes("admin") || roles.includes("super_admin");
        
        return isAdmin ? `/time/${teamData.slug}` : `/time/${teamData.slug}`;
      }
    }
    
    // 3. Se tem jogador_id mas não team_id → buscar time do jogador
    if (prof?.jogador_id) {
      const { data: jogData } = await supabase
        .from("jogadores")
        .select("team_id, teams(slug)")
        .eq("id", prof.jogador_id)
        .maybeSingle();
      
      // @ts-expect-error - Handle joined query types
      if (jogData?.teams?.slug) {
        // @ts-expect-error
        return `/time/${jogData.teams.slug}`;
      }
    }
    
    // 4. Sem time → ir para escolha
    return "/escolha";
  };

  // Redirect if already logged in (esp. after Google callback)
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    const redirectUser = async () => {
      const destination = await determineDestination(user.id);
      navigate(destination, { replace: true });
    };
    
    redirectUser();
  }, [user, authLoading, navigate]);

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

      const destination = await determineDestination(authData.user.id);

      if (profile?.aprovado || isAdmin) {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        navigate(destination, { replace: true });
      } else if (!profile?.team_id && !profile?.jogador_id) {
        toast({
          title: "Bem-vindo!",
          description: "Escolha como você quer começar no FutGestor.",
        });
        navigate("/escolha", { replace: true });
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
        // Auto-confirmed: redirect to escolha
        navigate("/escolha");
        toast({ title: "Cadastro realizado!", description: "Escolha como você quer começar." });
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

  // Mostra LoadingScreen enquanto auth carrega OU enquanto o redirect está sendo processado
  if (authLoading || user) {
    return <LoadingScreen />;
  }

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
            <>
              {/* Login Social com Google */}
              <div className="mb-6 space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold h-12"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Entrar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#050505] px-2 text-slate-500 font-bold italic">ou</span>
                  </div>
                </div>
              </div>

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
            </>
            )}

          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
