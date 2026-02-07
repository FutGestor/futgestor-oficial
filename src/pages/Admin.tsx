import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { 
  LayoutDashboard, Calendar, Users, DollarSign, Trophy, Bell, ClipboardList,
  LogOut, Menu, Home, UserCog, CalendarPlus, Shield, Settings, LucideIcon
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

interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hasBadge?: boolean;
}

function getSidebarItems(basePath: string): SidebarItem[] {
  return [
    { href: `${basePath}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/admin/jogos`, label: "Jogos", icon: Calendar },
    { href: `${basePath}/admin/solicitacoes`, label: "Solicitações", icon: CalendarPlus, hasBadge: true },
    { href: `${basePath}/admin/times`, label: "Times", icon: Shield },
    { href: `${basePath}/admin/jogadores`, label: "Jogadores", icon: Users },
    { href: `${basePath}/admin/usuarios`, label: "Usuários", icon: UserCog },
    { href: `${basePath}/admin/transacoes`, label: "Transações", icon: DollarSign },
    { href: `${basePath}/admin/resultados`, label: "Resultados", icon: Trophy },
    { href: `${basePath}/admin/escalacoes`, label: "Escalações", icon: ClipboardList },
    { href: `${basePath}/admin/avisos`, label: "Avisos", icon: Bell },
    { href: `${basePath}/admin/configuracoes`, label: "Configurações", icon: Settings },
  ];
}

function NavMenu({ setSidebarOpen, currentPath, sidebarItems }: { setSidebarOpen: (open: boolean) => void; currentPath: string; sidebarItems: SidebarItem[] }) {
  const { data: pendingCount } = useSolicitacoesPendentesCount();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {sidebarItems.map((item) => {
        const isActive = currentPath === item.href;
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { basePath } = useTeamSlug();

  const sidebarItems = getSidebarItems(basePath);

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <FutGestorLogo className="mx-auto mb-4 h-20 w-20" />
          <h1 className="mb-2 text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="mb-4 text-muted-foreground">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Conectado como: {user.email}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate(basePath)}>
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Site
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
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

          <NavMenu setSidebarOpen={setSidebarOpen} currentPath={location.pathname} sidebarItems={sidebarItems} />

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
            <Route path="/jogos" element={<AdminJogos />} />
            <Route path="/solicitacoes" element={<AdminSolicitacoes />} />
            <Route path="/times" element={<AdminTimes />} />
            <Route path="/jogadores" element={<AdminJogadores />} />
            <Route path="/usuarios" element={<AdminUsuarios />} />
            <Route path="/transacoes" element={<AdminTransacoes />} />
            <Route path="/resultados" element={<AdminResultados />} />
            <Route path="/escalacoes" element={<AdminEscalacoes />} />
            <Route path="/avisos" element={<AdminAvisos />} />
            <Route path="/configuracoes" element={<AdminConfiguracoes />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
