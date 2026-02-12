import { Link, useLocation } from "react-router-dom";
import { Trophy, Medal, Bell, Award, Headphones, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvisosNaoLidos } from "@/hooks/useAvisoLeituras";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";

export function MobileBottomNav() {
  const location = useLocation();
  const { basePath, team } = useTeamSlug();
  const { data: naoLidos } = useAvisosNaoLidos(team?.id);
  const { user } = useAuth();
  const { hasCampeonatos, hasFinanceiro, hasAvisos } = usePlanAccess(team.id);

  const publicItems = [
    { href: `${basePath}/resultados`, label: "Resultados", icon: Trophy },
    ...(hasCampeonatos ? [{ href: `${basePath}/ligas`, label: "Ligas", icon: Award }] : []),
  ];

  const memberItems = [
    { href: `${basePath}/ranking`, label: "Ranking", icon: Medal },
    ...(hasFinanceiro ? [{ href: `${basePath}/financeiro`, label: "Financeiro", icon: DollarSign }] : []),
    ...(hasAvisos ? [{ href: `${basePath}/avisos`, label: "Avisos", icon: Bell }] : []),
    { href: `${basePath}/suporte`, label: "Suporte", icon: Headphones },
  ];

  const navItems = user ? [...publicItems, ...memberItems] : publicItems;

  const notificationCount = naoLidos ?? 0;

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
