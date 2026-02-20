import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, X, Instagram, MessageCircle, User, LogOut, Sun, Moon, Headphones, 
  BarChart3, ShieldAlert, ChevronDown, LayoutDashboard, CalendarPlus, 
  Search, ShieldCheck, Settings
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { TeamShield } from "@/components/TeamShield";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { usePlanAccess } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useTodosChamados, useChamadosNaoLidos } from "@/hooks/useChamados";
import { useAvisosNaoLidos } from "@/hooks/useAvisoLeituras";
import { useSolicitacoesPendentesCount } from "@/hooks/useSolicitacoes";
import { MobileMenuSheet } from "./MobileMenuSheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const location = useLocation();
  const { user, profile, isAdmin, isSuperAdmin, isGodAdmin, isApproved, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: chamados } = useTodosChamados();
  const isPlayer = !!profile?.jogador_id && !isAdmin;
  const { team, isLoading: teamLoading } = useTeamConfig();
  const teamSlugValue = team?.slug;

  useEffect(() => {
    // Forçar modo escuro globalmente
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  const basePath = teamSlugValue ? `/time/${teamSlugValue}` : "";
  const teamName = team?.nome || "FutGestor";
  const teamEscudo = team?.escudo_url || null;
  const redesSociais = team?.redes_sociais || {};
  const teamId = team?.id || null;
  const { hasRanking, hasResultados, hasCampeonatos, hasFinanceiro, hasAvisos } = usePlanAccess(teamId);
  
  const { data: avisosNaoLidos } = useAvisosNaoLidos(teamId || undefined);
  const { data: suporteNotificacoes } = useChamadosNaoLidos();
  const { data: solicitacoesPendentes = 0 } = useSolicitacoesPendentesCount(teamId || undefined);

  // Nav items visíveis para todos (incluindo visitantes) - condicionados ao plano
  const visitorNavItems = teamSlugValue
    ? [
      { href: basePath, label: "Início" },
      { href: `${basePath}/agenda`, label: "Agenda" },
      { href: `${basePath}/resultados`, label: "Resultados" },
      ...(hasRanking ? [{ href: `${basePath}/ranking`, label: "Ranking" }] : []),
      ...(hasCampeonatos ? [{ href: `${basePath}/ligas`, label: "Ligas" }] : []),
    ]
    : [{ href: "/", label: "Início" }];

  // Nav items apenas para membros logados
  const memberNavItems = teamSlugValue
    ? [
      { href: `${basePath}/chat`, label: "Chat" },
      { href: `${basePath}/escalacao`, label: "Escalação" },
      { href: `${basePath}/jogadores`, label: "Jogadores" },
      { href: `${basePath}/conquistas`, label: "Conquistas" },
    ]
    : [];

  const privateNavItems = teamSlugValue
    ? [
      ...(hasFinanceiro ? [{ href: `${basePath}/financeiro`, label: "Financeiro" }] : []),
      ...(hasAvisos ? [{ 
        href: `${basePath}/avisos`, 
        label: "Avisos",
        badge: avisosNaoLidos && avisosNaoLidos > 0 ? avisosNaoLidos : undefined
      }] : []),
      { 
        href: suporteNotificacoes?.lastTicketId 
          ? `${basePath}/suporte?chamado_id=${suporteNotificacoes.lastTicketId}` 
          : `${basePath}/suporte`, 
        label: "Suporte",
        badge: suporteNotificacoes?.count && suporteNotificacoes.count > 0 ? suporteNotificacoes.count : undefined
      },
      { href: `${basePath}/guia`, label: "Guia" },
    ]
    : [];

  const adminNavItems = isAdmin && teamSlugValue
    ? [
      { href: `${basePath}/gestao`, label: "Gestão" },
    ]
    : [];

  const navItems = user
    ? [...visitorNavItems, ...memberNavItems, ...privateNavItems, ...adminNavItems]
    : visitorNavItems;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/auth");
  };

  const isActive = (href: string) => {
    if (href === basePath || href === "/") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const teamPrimaryColor = team?.cores?.primary || "#0F2440";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/50">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo area */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to={basePath || "/"}>
            <TeamShield 
              escudoUrl={teamEscudo} 
              teamName={teamName}
              size="sm" 
            />
          </Link>
          
          {user && (
            <Link to={`${basePath}/meu-perfil`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-white/90 hover:bg-white/10 flex items-center gap-1.5"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-tight">Meu Perfil</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            if (item.label === "Gestão") {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10",
                        isActive(`${basePath}/gestao`) && "bg-secondary text-secondary-foreground"
                      )}
                      style={{ color: !isActive(`${basePath}/gestao`) ? "inherit" : undefined }}
                    >
                      {item.label}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-card border-border">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`${basePath}/gestao`} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        <span>Visão Geral</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`${basePath}/solicitacoes`} className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4 text-primary" />
                        <span>Solicitações</span>
                        {solicitacoesPendentes > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {solicitacoesPendentes > 9 ? "9+" : solicitacoesPendentes}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`${basePath}/descobrir`} className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        <span>Descobrir</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`${basePath}/times`} className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Times</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                  isActive(item.href.split('?')[0])
                    ? "bg-primary text-white shadow-lg shadow-primary/40"
                    : "text-white/80 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/40 mx-0.5 lg:mx-0"
                )}
              >
                <span className="text-shadow-sm">{item.label}</span>
                {(item as any).badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20 animate-in zoom-in duration-300">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* NotificationBell — notificações automáticas */}
          <Link to="/explorar">
            <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 hover:text-white">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {user && <NotificationBell />}

          {/* Painel Master - visível apenas para God Admin (futgestor@gmail.com) */}
          {isGodAdmin && (
            <>
              {/* Versão Desktop */}
              <Link to="/super-admin" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#D4A84B] hover:bg-[#D4A84B]/10 relative border border-[#D4A84B]/20"
                >
                  <ShieldAlert className="h-4 w-4 lg:mr-1" />
                  <span className="hidden lg:inline">Painel Master</span>
                  {chamados?.filter(c => c.status === "aberto").length ? (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20 animate-in zoom-in duration-300">
                      {chamados.filter(c => c.status === "aberto").length}
                    </span>
                  ) : null}
                </Button>
              </Link>
              {/* Versão Mobile - ícone compacto */}
              <Link to="/super-admin" className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[#D4A84B] hover:bg-[#D4A84B]/10 relative border border-[#D4A84B]/20"
                >
                  <ShieldAlert className="h-5 w-5" />
                  {chamados?.filter(c => c.status === "aberto").length ? (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20 animate-in zoom-in duration-300">
                      {chamados.filter(c => c.status === "aberto").length}
                    </span>
                  ) : null}
                </Button>
              </Link>
            </>
          )}

          {user ? (
            <>
              {isApproved && teamSlugValue && !isPlayer && (
                <Link to={`${basePath}/meu-perfil`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden hover:bg-white/10 md:inline-flex"
                    style={{ color: "inherit" }}
                  >
                    <User className="h-4 w-4 lg:mr-1" />
                    <span className="hidden lg:inline text-shadow-sm">Meu Perfil</span>
                  </Button>
                </Link>
              )}
              {isPlayer && teamSlugValue && (
                <Link to={`${basePath}/meu-perfil`}>
                  <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                    <User className="h-4 w-4 lg:mr-1" />
                    <span className="hidden lg:inline text-shadow-sm">Minha Área</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden hover:bg-white/10 md:inline-flex"
                style={{ color: "inherit" }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                <User className="mr-1 h-4 w-4" />
                Entrar
              </Button>
            </Link>
          )}


          {/* Mobile Menu Button - Replaced by MobileMenuSheet */}
          {user && <MobileMenuSheet />}
        </div>
      </div>

      {/* Mobile Navigation - Hidden as we now use Bottom Nav and Sheet */}
      {false && mobileMenuOpen && (
        <div className="border-t border-border/40 bg-primary md:hidden">
          <nav className="container flex flex-col gap-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href.split('?')[0])
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                {item.label}
                {(item as any).badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
              {redesSociais.instagram && (
                <a
                  href={redesSociais.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {redesSociais.whatsapp && (
                <a
                  href={redesSociais.whatsapp.startsWith('http') ? redesSociais.whatsapp : `https://${redesSociais.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {user ? (
                <div className="ml-auto flex flex-wrap gap-2">
                  {isPlayer && (
                    <Link to={`${basePath}/meu-perfil`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">
                        <User className="mr-1 h-4 w-4" />
                        Minha Área
                      </Button>
                    </Link>
                  )}
                  {isApproved && teamSlugValue && !isPlayer && (
                    <Link to={`${basePath}/meu-perfil`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">
                        <User className="mr-1 h-4 w-4" />
                        Meu Perfil
                      </Button>
                    </Link>
                  )}
                  {isAdmin && teamSlugValue && (
                    <Link to={`${basePath}/gestao`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">Gestão</Button>
                    </Link>
                  )}
                  {isGodAdmin && (
                    <Link to="/super-admin" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full justify-start relative bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Painel Master
                        {chamados?.filter(c => c.status === "aberto").length ? (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                            {chamados.filter(c => c.status === "aberto").length}
                          </span>
                        ) : null}
                      </Button>
                    </Link>
                  )}
                  <Button variant="secondary" size="sm" onClick={handleSignOut}>
                    <LogOut className="mr-1 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="ml-auto">
                  <Button variant="secondary" size="sm">
                    <User className="mr-1 h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
