import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  ClipboardList, 
  Menu, 
  Trophy, 
  Award, 
  Medal, 
  Bell, 
  Headphones, 
  User, 
  LogOut, 
  Instagram, 
  MessageCircle,
  Settings,
  ShieldCheck,
  CalendarPlus,
  BookOpen,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvisosNaoLidos } from "@/hooks/useAvisoLeituras";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import logoFutgestor from "@/assets/logo-futgestor.png";
import { TeamShield } from "@/components/TeamShield";

export function MobileBottomNav() {
  const location = useLocation();
  const { basePath, team } = useTeamSlug();
  const { data: naoLidos } = useAvisosNaoLidos(team?.id);
  const { user, profile, isAdmin, isSuperAdmin, isApproved, signOut } = useAuth();
  const { hasCampeonatos, hasFinanceiro, hasAvisos } = usePlanAccess(team?.id);
  const [open, setOpen] = useState(false);

  const isPlayer = !!profile?.jogador_id && !isAdmin;
  const redesSociais = team?.redes_sociais || {};

  // Main Bottom Nav Items (Always visible)
  const mainItems = [
    { href: basePath || "/", label: "Início", icon: Home },
    { href: `${basePath}/agenda`, label: "Agenda", icon: Calendar },
    ...(hasFinanceiro ? [{ href: `${basePath}/financeiro`, label: "Financeiro", icon: DollarSign }] : []),
    { href: `${basePath}/ranking`, label: "Ranking", icon: Medal },
  ];

  // Menu Items (Inside Sheet)
  const menuItems = [
    { href: `${basePath}/suporte`, label: "Suporte", icon: Headphones },
    { href: `${basePath}/conquistas`, label: "Arena de Conquistas", icon: Trophy },
    { href: `${basePath}/guia`, label: "Guia", icon: BookOpen },
  ];

  const adminMenuItems = [
    { href: `${basePath}/descobrir`, label: "Descobrir", icon: Search },
    { href: `${basePath}/times`, label: "Times", icon: ShieldCheck },
  ];

  const notificationCount = naoLidos ?? 0;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  if (!basePath) return null; // Only show on team context

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/80 backdrop-blur-xl md:hidden safe-area-bottom pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around py-2">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                  open ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <Menu className={cn("h-6 w-6", open && "fill-current")} strokeWidth={open ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Menu</span>
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[540px] overflow-y-auto bg-black/60 backdrop-blur-3xl border-white/5 text-white shadow-2xl">
              <SheetHeader className="text-left mb-8 border-b border-white/10 pb-6">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-amber-500/50 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <TeamShield 
                      escudoUrl={team?.escudo_url || null} 
                      teamName={team?.nome || "FutGestor"} 
                      size="md" 
                      className="relative border-white/20 shadow-xl"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate text-xl font-black uppercase tracking-tight leading-none bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                      {team?.nome || "FutGestor"}
                    </span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 shadow-sm">
                      PAINEL DO CLUBE
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="grid gap-2 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2 mb-3">Navegação Principal</p>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  const showBadge = item.href === `${basePath}/avisos` && notificationCount > 0;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-primary text-black shadow-lg shadow-primary/20 scale-[1.02]"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "opacity-70")} />
                      {item.label}
                      {showBadge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg animate-bounce">
                          {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <>
                    <div className="my-6 border-t border-white/10 mx-2" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary px-2 mb-3 flex items-center gap-2 shadow-sm">
                       <ShieldCheck className="h-3.5 w-3.5" />
                       MÓDULO ADMINISTRATIVO
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {adminMenuItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-[11px] font-bold transition-all border",
                              isActive
                                ? "bg-white/10 border-primary text-primary shadow-inner shadow-primary/10"
                                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <Icon className={cn("h-6 w-6 transition-all duration-300", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(5,96,179,0.5)]" : "opacity-50 group-hover:opacity-100")} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="my-6 border-t border-white/10 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2 mb-3">Sua Conta</p>

                <div className="space-y-1">
                  {isApproved && !isPlayer && (
                    <Link to={`${basePath}/meu-perfil`} onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-4 px-4 h-12 text-white/70 hover:text-white hover:bg-white/5 rounded-xl font-semibold">
                        <User className="h-5 w-5 opacity-70" />
                        Gerenciar Perfil
                      </Button>
                    </Link>
                  )}
                  
                  {isPlayer && (
                    <Link to={`${basePath}/meu-perfil`} onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-4 px-4 h-12 text-white/70 hover:text-white hover:bg-white/5 rounded-xl font-semibold">
                        <User className="h-5 w-5 opacity-70" />
                        Minha Área de Atleta
                      </Button>
                    </Link>
                  )}

                  <Button variant="ghost" className="w-full justify-start gap-4 px-4 h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-bold" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5 opacity-70" />
                    Encerrar Sessão
                  </Button>
                </div>

                <div className="mt-auto pt-8 pb-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                    FutGestor Pro v2.0
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
