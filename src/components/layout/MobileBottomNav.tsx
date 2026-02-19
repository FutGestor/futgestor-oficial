import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  MessageCircle,
  Medal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { usePlanAccess } from "@/hooks/useSubscription";
import { useUnreadChatCount } from "@/hooks/useChatNotifications";

export function MobileBottomNav() {
  const location = useLocation();
  const { team, isLoading } = useTeamConfig();
  const teamSlugValue = team?.slug;
  const basePath = teamSlugValue ? `/time/${teamSlugValue}` : "";
  
  const { data: chatUnread = 0 } = useUnreadChatCount(team?.id);
  const { hasFinanceiro } = usePlanAccess(team?.id);

  // Main Bottom Nav Items (Always visible)
  const mainItems = [
    { href: basePath || "/", label: "Início", icon: Home },
    ...(hasFinanceiro ? [{ href: `${basePath}/financeiro`, label: "Financeiro", icon: DollarSign }] : []),
    { href: `${basePath}/agenda`, label: "Agenda", icon: Calendar },
    { 
      href: `${basePath}/chat`, 
      label: "Chat", 
      icon: MessageCircle,
      badge: chatUnread > 0 ? (chatUnread > 9 ? "9+" : chatUnread) : null
    },
    { href: `${basePath}/ranking`, label: "Ranking", icon: Medal },
  ];

  if (!teamSlugValue) return null; // Only show if we have a team context (from URL or fallback)

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/95 backdrop-blur-xl md:hidden safe-area-bottom pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
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
                <div className="relative">
                  <Icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-background animate-in zoom-in">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
