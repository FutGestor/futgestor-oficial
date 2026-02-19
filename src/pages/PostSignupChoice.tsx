import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Trophy, Users, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function PostSignupChoice() {
  const [view, setView] = useState<"choice" | "join">("choice");
  const [inviteCode, setInviteCode] = useState("");
  const [isChecking, setIsChecking] = useState(true); // Começa true para blindar a tela
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    const checkStatusAndRedirect = async () => {
      try {
        // Busca perfil fresquinho diretamente do Supabase para evitar delay do hook useAuth
        const { data: directProfile, error: profileError } = await supabase
          .from("profiles")
          .select("team_id, jogador_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Caso 1: Tem time vinculado
        if (directProfile?.team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("slug")
            .eq("id", directProfile.team_id)
            .maybeSingle();

          if (teamData?.slug) {
            // Check if user is admin/owner
            const { data: userRoles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .eq("team_id", directProfile.team_id);
              
            const roles = userRoles?.map(r => r.role as string) || [];
            const isAdmin = roles.includes("admin") || roles.includes("super_admin");

            if (isAdmin) {
              navigate(`/time/${teamData.slug}`, { replace: true });
            } else {
              navigate(`/time/${teamData.slug}`, { replace: true });
            }
            return;
          }
        }

        // Caso 2: É jogador vinculado
        if (directProfile?.jogador_id) {
          const { data: playerTeam } = await supabase
            .from("jogadores")
            .select("team_id, teams(slug)")
            .eq("id", directProfile.jogador_id)
            .maybeSingle();
            
          // @ts-expect-error - Joined query types not fully mapped
          if (playerTeam?.teams?.slug) {
            // @ts-expect-error - Joined query types not fully mapped
            navigate(`/time/${playerTeam.teams.slug}`, { replace: true });
            return;
          }
        }
        
        // Caso 3: Realmente não tem time nem jogador vinculado -> liberar a UI
        setIsChecking(false);
      } catch (err) {
        console.error("Critical error in PostSignupChoice blindagem:", err);
        // Em caso de erro crítico, liberamos a UI para não travar o usuário, 
        // mas idealmente isso não deve acontecer com o Supabase online.
        setIsChecking(false);
      }
    };

    checkStatusAndRedirect();
  }, [user, authLoading, navigate]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      navigate(`/convite/${inviteCode.trim()}`);
    }
  };

  // Só renderiza se o auth terminou E o check de redirecionamento confirmou que não tem time
  if (authLoading || isChecking) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center">
              <FutGestorLogo className="h-20 w-20" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(5,96,179,0.5)]">
              COMO VOCÊ QUER USAR O <span className="text-primary">FUTGESTOR?</span>
            </h1>
            <p className="text-slate-400 font-medium">Escolha uma opção para começar sua jornada.</p>
          </div>

          {view === "choice" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Criar Time */}
              <div
                onClick={() => navigate("/onboarding")}
                className="group relative flex flex-col text-left h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate("/onboarding")}
              >
                <Card className="h-full bg-black/40 backdrop-blur-xl border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="h-32 w-32 text-primary" />
                  </div>
                  <CardHeader className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-white font-black italic uppercase italic">Criar meu Time</CardTitle>
                    <CardDescription className="text-slate-400 text-base leading-relaxed">
                      Sou o organizador ou dono do time. Quero gerenciar jogadores, finanças e jogos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button 
                      title="Ir para criação de time"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase italic group-hover:shadow-[0_0_20px_rgba(5,96,179,0.4)]"
                    >
                      Começar agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Card Entrar no Time */}
              <div
                onClick={() => setView("join")}
                className="group relative flex flex-col text-left h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView("join")}
              >
                <Card className="h-full bg-black/40 backdrop-blur-xl border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="h-32 w-32 text-primary" />
                  </div>
                  <CardHeader className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-white font-black italic uppercase italic">Entrar num Time</CardTitle>
                    <CardDescription className="text-slate-400 text-base leading-relaxed">
                      Já fui convidado por um time e tenho o código de acesso para entrar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button 
                      variant="outline" 
                      title="Inserir Código de Convite"
                      className="w-full border-white/10 text-white hover:bg-white/10 font-bold uppercase italic transition-all group-hover:border-white/20"
                    >
                      Inserir Código
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => setView("choice")}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Voltar para escolha"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <CardTitle className="text-xl text-white uppercase italic font-black tracking-tight">Inserir Código</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 font-medium">
                    Digite o código de convite enviado pelo seu capitão ou administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoin} className="space-y-6">
                    <div className="relative">
                      <Input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="EX: TIME-ABC-123"
                        className="h-14 bg-black/60 border-white/10 text-white focus:border-primary/50 text-center text-xl font-black tracking-[4px] placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-600 uppercase"
                        autoFocus
                      />
                    </div>
                    <Button 
                      disabled={!inviteCode.trim()}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase italic shadow-[0_0_20px_rgba(5,96,179,0.4)]"
                    >
                      Acessar Time
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
