import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserNav } from "./UserNav";
import { CommandMenu } from "./CommandMenu";
import { Button } from "@/components/ui/button";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeSelector } from "@/components/features/ThemeSelector";
import { OnboardingTour } from "@/components/features/OnboardingTour";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const teamSlug = useOptionalTeamSlug();
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const logoFutgestor = "/lovable-uploads/f127117e-7901-4475-9c86-13a48e79e612.png";
  const basePath = typeof teamSlug === 'string' ? `/${teamSlug}` : "";

  const visitorNavItems = [
    { href: "/", label: "Início" },
    { href: "/precos", label: "Planos" },
    { href: "/funcionalidades", label: "Recursos" },
  ];

  const memberNavItems = [
    { href: "/meus-times", label: "Meus Times" },
  ];
  
  const hasFinanceiro = true;
  const hasAvisos = true;

  const privateNavItems = typeof teamSlug === 'string'
    ? [
      ...(hasFinanceiro ? [{ href: `${basePath}/financeiro`, label: "Financeiro" }] : []),
      ...(hasAvisos ? [{ href: `${basePath}/avisos`, label: "Avisos" }] : []),
      { href: `${basePath}/suporte`, label: "Suporte" },
    ]
    : [];

  const navItems = user
    ? [...visitorNavItems, ...memberNavItems, ...privateNavItems]
    : visitorNavItems;

  const isActive = (href: string) => {
    if (href === basePath || href === "/") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#D4A84B] px-4 md:px-6 h-16 flex items-center justify-between shadow-md transition-colors duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-900 hover:bg-black/10"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")} data-tour="header-logo">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <img src={logoFutgestor} alt="Logo" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 hidden md:block">
            {typeof teamSlug === 'string' ? teamSlug : "FutGestor"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <nav className="hidden md:flex items-center gap-1 mr-4">
          {navItems.map((item) => (
             <Button
               key={item.href}
               variant="ghost"
               className={cn(
                 "text-gray-900 hover:bg-black/5",
                 isActive(item.href) && "bg-black/10 font-bold"
               )}
               onClick={() => navigate(item.href)}
             >
               {item.label}
             </Button>
          ))}
        </nav>

        {typeof teamSlug === 'string' && (
           <div className="hidden lg:flex items-center text-sm font-medium text-gray-800 bg-white/20 px-3 py-1 rounded-full">
             <span className="opacity-70 mr-1">Time:</span> {teamSlug}
           </div>
        )}
        
        <CommandMenu />
        
        <ThemeSelector />

        <OnboardingTour />

        <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-black/10">
          <Bell className="h-5 w-5" />
        </Button>

        {user ? (
          <UserNav />
        ) : (
          <Button 
            onClick={() => navigate("/login")}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm"
          >
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}
