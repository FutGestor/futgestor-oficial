
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, DollarSign, Calendar, BarChart, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const teamSlug = useOptionalTeamSlug();
  const location = useLocation();
  const basePath = typeof teamSlug === 'string' ? `/${teamSlug}` : "";

  const items = [
    { title: "Início", url: basePath || "/", icon: Home },
    ...(teamSlug ? [
      { title: "Elenco", url: `${basePath}/elenco`, icon: Users },
      { title: "Financeiro", url: `${basePath}/financeiro`, icon: DollarSign },
      { title: "Calendário", url: `${basePath}/calendario`, icon: Calendar },
      { title: "Estatísticas", url: `${basePath}/estatisticas`, icon: BarChart },
      { title: "Configurações", url: `${basePath}/configuracoes`, icon: Settings },
    ] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-lg font-bold">Menu</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <Link to={item.url}>
                  <item.icon className="h-4 w-4 mr-2" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/suporte">
                <LifeBuoy className="h-4 w-4 mr-2" />
                <span>Suporte</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
