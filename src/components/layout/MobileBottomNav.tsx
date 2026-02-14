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
  MessageCircle 
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
    { href: `${basePath}/jogadores`, label: "Jogadores", icon: User },
    { href: `${basePath}/resultados`, label: "Resultados", icon: Trophy },
    ...(hasCampeonatos ? [{ href: `${basePath}/ligas`, label: "Ligas", icon: Award }] : []),
    { href: `${basePath}/escalacao`, label: "Escalação", icon: ClipboardList },
    ...(hasAvisos ? [{ href: `${basePath}/avisos`, label: "Avisos", icon: Bell }] : []),
    { href: `${basePath}/suporte`, label: "Suporte", icon: Headphones },
  ];

  const notificationCount = naoLidos ?? 0;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  if (!basePath) return null; // Only show on team context

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden safe-area-bottom pb-safe">
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
                <span className="text-[10px] font-medium">{item.label}</span>
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
            <SheetContent side="right" className="w-[300px] sm:w-[540px] overflow-y-auto">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="flex items-center gap-3">
                  {team?.escudo_url ? (
                    <img src={team.escudo_url} alt={team.nome} className="h-10 w-10 object-contain" />
                  ) : (
                    <img src={logoFutgestor} alt="FutGestor" className="h-10 w-10 object-contain" />
                  )}
                  <span className="truncate text-lg font-bold">{team?.nome || "FutGestor"}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="grid gap-2 py-4">
                <p className="text-sm font-medium text-muted-foreground px-2 mb-2">Navegação</p>
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                      {showBadge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="my-4 border-t" />
                <p className="text-sm font-medium text-muted-foreground px-2 mb-2">Conta</p>

                {isApproved && !isPlayer && (
                  <Link to={`${basePath}/meu-perfil`} onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                      <User className="h-5 w-5" />
                      Meu Perfil
                    </Button>
                  </Link>
                )}
                
                {isPlayer && (
                  <Link to="/player/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                      <User className="h-5 w-5" />
                      Minha Área
                    </Button>
                  </Link>
                )}

                {isAdmin && (
                  <Link to={`${basePath}/admin`} onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                      <User className="h-5 w-5" />
                      Admin
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>

                <div className="my-4 border-t" />
                <div className="flex gap-2 px-2">
                  {redesSociais?.instagram && (
                    <a href={redesSociais.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {redesSociais?.whatsapp && (
                    <a href={redesSociais.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
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
