import { Link, useLocation } from "react-router-dom";
import { Calendar, Trophy, Medal, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvisos } from "@/hooks/useData";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useAuth } from "@/hooks/useAuth";

export function MobileBottomNav() {
  const location = useLocation();
  const { data: avisos } = useAvisos();
  const { basePath } = useTeamSlug();
  const { user } = useAuth();

  const publicItems = [
    { href: `${basePath}/agenda`, label: "Agenda", icon: Calendar },
    { href: `${basePath}/resultados`, label: "Resultados", icon: Trophy },
  ];

  const memberItems = [
    { href: `${basePath}/ranking`, label: "Ranking", icon: Medal },
    { href: `${basePath}/avisos`, label: "Avisos", icon: Bell },
  ];

  const navItems = user ? [...publicItems, ...memberItems] : publicItems;

  // Contar avisos dos últimos 7 dias
  const avisosRecentes = avisos?.filter((a) => {
    const dataAviso = new Date(a.created_at);
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    return dataAviso >= seteDiasAtras;
  });

  const notificationCount = avisosRecentes?.length ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.href === `${basePath}/avisos` && notificationCount > 0;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
