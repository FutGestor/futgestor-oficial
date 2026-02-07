import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, MessageCircle, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";

// Itens públicos - visíveis para todos
const publicNavItems = [
  { href: "/", label: "Início" },
  { href: "/agenda", label: "Agenda" },
  { href: "/escalacao", label: "Escalação" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/ranking", label: "Ranking" },
  { href: "/resultados", label: "Resultados" },
];

// Itens privados - visíveis apenas para usuários logados
const privateNavItems = [
  { href: "/financeiro", label: "Financeiro" },
  { href: "/avisos", label: "Avisos" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isApproved, signOut } = useAuth();
  const { team } = useTeamConfig();

  // Combinar itens de navegação baseado no estado de login
  const navItems = user 
    ? [...publicNavItems, ...privateNavItems] 
    : publicNavItems;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {team.escudo_url ? (
            <img
              src={team.escudo_url}
              alt={team.nome}
              className="h-12 w-12 object-contain"
            />
          ) : (
            <Shield className="h-12 w-12 text-primary-foreground" />
          )}
          <span className="hidden text-lg font-bold text-primary-foreground md:inline-block">
            {team.nome}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === item.href
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
          <ThemeToggle />
          {team.redes_sociais.instagram && (
            <a
              href={team.redes_sociais.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:inline-flex"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {team.redes_sociais.whatsapp && (
            <a
              href={team.redes_sociais.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:inline-flex"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          
          {user ? (
            <>
              {isApproved && (
                <Link to="/meu-perfil">
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
              {isAdmin && (
                <Link to="/admin">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
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
              <Button
                variant="secondary"
                size="sm"
                className="hidden md:inline-flex"
              >
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
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
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
                  location.pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
              {team.redes_sociais.instagram && (
                <a
                  href={team.redes_sociais.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {team.redes_sociais.whatsapp && (
                <a
                  href={team.redes_sociais.whatsapp}
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
                  {isApproved && (
                    <Link
                      to="/meu-perfil"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                    <Button 
                      variant="secondary" 
                      size="sm"
                    >
                      <User className="mr-1 h-4 w-4" />
                      Meu Perfil
                    </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="secondary" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-auto"
                >
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
