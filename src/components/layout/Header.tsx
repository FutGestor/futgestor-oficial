import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, MessageCircle, User, LogOut, Sun, Moon, Headphones } from "lucide-react";
import logoFutgestor from "@/assets/logo-futgestor.png";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { usePlanAccess } from "@/hooks/useSubscription";
import { useOpenChamadosCount } from "@/hooks/useChamados";
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const location = useLocation();
  const { user, profile, isAdmin, isSuperAdmin, isApproved, signOut } = useAuth();
  const isPlayer = !!profile?.jogador_id && !isAdmin;
  const teamSlug = useOptionalTeamSlug();
  const openChamadosCount = useOpenChamadosCount();

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const basePath = teamSlug?.basePath || "";
  const teamName = teamSlug?.team.nome || "FutGestor";
  const teamEscudo = teamSlug?.team.escudo_url || null;
  const redesSociais = teamSlug?.team.redes_sociais || {};
  const teamId = teamSlug?.team.id || null;
  const { hasRanking, hasResultados, hasCampeonatos } = usePlanAccess(teamId);

  // Nav items visíveis para todos (incluindo visitantes) - condicionados ao plano
  const visitorNavItems = teamSlug
    ? [
        { href: basePath, label: "Início" },
        ...(hasResultados ? [{ href: `${basePath}/resultados`, label: "Resultados" }] : []),
        ...(hasRanking ? [{ href: `${basePath}/ranking`, label: "Ranking" }] : []),
        ...(hasCampeonatos ? [{ href: `${basePath}/ligas`, label: "Ligas" }] : []),
      ]
    : [{ href: "/", label: "Início" }];

  // Nav items apenas para membros logados
  const memberNavItems = teamSlug
    ? [
        { href: `${basePath}/escalacao`, label: "Escalação" },
        { href: `${basePath}/jogadores`, label: "Jogadores" },
      ]
    : [];

  const privateNavItems = teamSlug
    ? [
        { href: `${basePath}/financeiro`, label: "Financeiro" },
        { href: `${basePath}/avisos`, label: "Avisos" },
        { href: `${basePath}/suporte`, label: "Suporte" },
      ]
    : [];

  const navItems = user
    ? [...visitorNavItems, ...memberNavItems, ...privateNavItems]
    : visitorNavItems;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === basePath || href === "/") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to={basePath || "/"} className="flex items-center gap-3">
          {teamEscudo ? (
            <img src={teamEscudo} alt={teamName} className="h-12 w-12 object-contain" />
          ) : (
            <img src={logoFutgestor} alt="FutGestor" className="h-12 w-12 object-contain" />
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Super Admin Suporte Link */}
          {isSuperAdmin && (
            <Link to="/super-admin/suporte" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-primary-foreground hover:bg-primary-foreground/10 md:inline-flex"
              >
                <Headphones className="mr-1 h-4 w-4" />
                Suporte Global
              </Button>
              {openChamadosCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {openChamadosCount}
                </span>
              )}
            </Link>
          )}
          
          {redesSociais.instagram && (
            <a
              href={redesSociais.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:inline-flex"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {redesSociais.whatsapp && (
            <a
              href={redesSociais.whatsapp.startsWith('http') ? redesSociais.whatsapp : `https://${redesSociais.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:inline-flex"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          
          {user ? (
            <>
              {isApproved && teamSlug && !isPlayer && (
                <Link to={`${basePath}/meu-perfil`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden text-primary-foreground hover:bg-primary-foreground/10 md:inline-flex"
                  >
                    <User className="mr-1 h-4 w-4" />
                    Meu Perfil
                  </Button>
                </Link>
              )}
              {isPlayer && (
                <Link to="/player/dashboard">
                  <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                    <User className="mr-1 h-4 w-4" />
                    Minha Área
                  </Button>
                </Link>
              )}
              {isAdmin && teamSlug && (
                <Link to={`${basePath}/admin`}>
                  <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden text-primary-foreground hover:bg-primary-foreground/10 md:inline-flex"
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-primary md:hidden">
          <nav className="container flex flex-col gap-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                {item.label}
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
                    <Link to="/player/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">
                        <User className="mr-1 h-4 w-4" />
                        Minha Área
                      </Button>
                    </Link>
                  )}
                  {isApproved && teamSlug && !isPlayer && (
                    <Link to={`${basePath}/meu-perfil`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">
                        <User className="mr-1 h-4 w-4" />
                        Meu Perfil
                      </Button>
                    </Link>
                  )}
                  {isAdmin && teamSlug && (
                    <Link to={`${basePath}/admin`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm">Admin</Button>
                    </Link>
                  )}
                  {isSuperAdmin && (
                    <Link to="/super-admin/suporte" onClick={() => setMobileMenuOpen(false)} className="relative">
                      <Button variant="secondary" size="sm">
                        <Headphones className="mr-1 h-4 w-4" />
                        Suporte Global
                      </Button>
                      {openChamadosCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {openChamadosCount}
                        </span>
                      )}
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
