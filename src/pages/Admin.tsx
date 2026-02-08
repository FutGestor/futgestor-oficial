import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { 
  LayoutDashboard, Calendar, Users, DollarSign, Trophy, Bell, ClipboardList,
  LogOut, Menu, Home, UserCog, CalendarPlus, Shield, Settings, LucideIcon, Lock, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSolicitacoesPendentesCount } from "@/hooks/useSolicitacoes";
import { cn } from "@/lib/utils";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { usePlanAccess } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";

// Admin pages
import AdminDashboard from "./admin/AdminDashboard";
import AdminJogos from "./admin/AdminJogos";
import AdminJogadores from "./admin/AdminJogadores";
import AdminTransacoes from "./admin/AdminTransacoes";
import AdminResultados from "./admin/AdminResultados";
import AdminAvisos from "./admin/AdminAvisos";
import AdminEscalacoes from "./admin/AdminEscalacoes";
import AdminUsuarios from "./admin/AdminUsuarios";
import AdminSolicitacoes from "./admin/AdminSolicitacoes";
import AdminTimes from "./admin/AdminTimes";
import AdminConfiguracoes from "./admin/AdminConfiguracoes";
import AdminPlanos from "./admin/AdminPlanos";
import AdminCampeonatos from "./admin/AdminCampeonatos";
import AdminCampeonatoDetalhe from "./admin/AdminCampeonatoDetalhe";

interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hasBadge?: boolean;
  locked?: boolean;
  requiredPlan?: string;
  featureName?: string;
}

function NavMenu({ 
  setSidebarOpen, 
  currentPath, 
  sidebarItems, 
  onLockedClick 
}: { 
  setSidebarOpen: (open: boolean) => void; 
  currentPath: string; 
  sidebarItems: SidebarItem[];
  onLockedClick: (requiredPlan: string, featureName: string) => void;
}) {
  const { data: pendingCount } = useSolicitacoesPendentesCount();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {sidebarItems.map((item) => {
        const isActive = currentPath === item.href;
        
        if (item.locked) {
          return (
            <button
              key={item.href}
              onClick={() => {
                setSidebarOpen(false);
                onLockedClick(item.requiredPlan || "Pro", item.featureName || item.label);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground/50 hover:bg-sidebar-accent/30"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              <Lock className="ml-auto h-4 w-4 text-yellow-500" />
            </button>
          );
        }
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.hasBadge && pendingCount && pendingCount > 0 ? (
              <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                {pendingCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; plan: string; feature: string }>({
    open: false, plan: "", feature: ""
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { basePath } = useTeamSlug();
  const { hasFinanceiro, hasAvisos, hasCampeonatos, isActive, isLoading: planLoading, plan } = usePlanAccess();

  // Build sidebar items with lock state
  const sidebarItems: SidebarItem[] = [
    { href: `${basePath}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/admin/planos`, label: "Planos", icon: Crown },
    { href: `${basePath}/admin/jogos`, label: "Jogos", icon: Calendar },
    { href: `${basePath}/admin/solicitacoes`, label: "Solicitações", icon: CalendarPlus, hasBadge: true },
    { href: `${basePath}/admin/times`, label: "Times", icon: Shield },
    { href: `${basePath}/admin/jogadores`, label: "Jogadores", icon: Users },
    { href: `${basePath}/admin/usuarios`, label: "Usuários", icon: UserCog },
    { 
      href: `${basePath}/admin/transacoes`, label: "Transações", icon: DollarSign,
      locked: !hasFinanceiro, requiredPlan: "Pro", featureName: "Gestão Financeira"
    },
    { href: `${basePath}/admin/resultados`, label: "Resultados", icon: Trophy },
    {
      href: `${basePath}/admin/campeonatos`, label: "Campeonatos", icon: Trophy,
      locked: !hasCampeonatos, requiredPlan: "Liga", featureName: "Gestor de Campeonatos"
    },
    { href: `${basePath}/admin/escalacoes`, label: "Escalações", icon: ClipboardList },
    { 
      href: `${basePath}/admin/avisos`, label: "Avisos", icon: Bell,
      locked: !hasAvisos, requiredPlan: "Pro", featureName: "Gestão de Avisos"
    },
    { href: `${basePath}/admin/configuracoes`, label: "Configurações", icon: Settings },
  ];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Paywall redirect: if no active plan and not on /planos, redirect
  useEffect(() => {
    if (!planLoading && !isActive && user && isAdmin && !location.pathname.endsWith("/planos")) {
      navigate(`${basePath}/admin/planos`, { replace: true });
    }
  }, [planLoading, isActive, user, isAdmin, location.pathname, basePath, navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (err) {
      console.error("Error checking admin role:", err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Desconectado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <FutGestorLogo className="mx-auto mb-4 h-16 w-16" />
          <Skeleton className="mx-auto h-6 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    // Non-admin user trying to access admin → redirect with warning
    if (user) {
      toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar o painel administrativo.",
      });
      navigate("/player/dashboard", { replace: true });
      return null;
    }
    navigate("/auth", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <UpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) => setUpgradeModal((prev) => ({ ...prev, open }))}
        requiredPlan={upgradeModal.plan}
        featureName={upgradeModal.feature}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <FutGestorLogo className="h-10 w-10" />
              <div>
                <p className="font-bold text-sidebar-foreground">FutGestor</p>
                <p className="text-xs text-sidebar-foreground/70">Painel Admin</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => navigate(basePath)}
                title="Ir para o Site"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleSignOut}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <NavMenu 
            setSidebarOpen={setSidebarOpen} 
            currentPath={location.pathname} 
            sidebarItems={sidebarItems}
            onLockedClick={(plan, feature) => setUpgradeModal({ open: true, plan, feature })}
          />

          <div className="border-t border-sidebar-border p-4">
            <p className="truncate text-xs text-sidebar-foreground/70">
              {user.email}
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">
            {sidebarItems.find((i) => i.href === location.pathname)?.label || "Admin"}
          </h1>
        </header>

        <main className="p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/planos" element={<AdminPlanos />} />
            <Route path="/jogos" element={<AdminJogos />} />
            <Route path="/solicitacoes" element={<AdminSolicitacoes />} />
            <Route path="/times" element={<AdminTimes />} />
            <Route path="/jogadores" element={<AdminJogadores />} />
            <Route path="/usuarios" element={<AdminUsuarios />} />
            <Route path="/transacoes" element={<AdminTransacoes />} />
            <Route path="/resultados" element={<AdminResultados />} />
            <Route path="/escalacoes" element={<AdminEscalacoes />} />
            <Route path="/avisos" element={<AdminAvisos />} />
            <Route path="/campeonatos" element={<AdminCampeonatos />} />
            <Route path="/campeonatos/:leagueId" element={<AdminCampeonatoDetalhe />} />
            <Route path="/configuracoes" element={<AdminConfiguracoes />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
