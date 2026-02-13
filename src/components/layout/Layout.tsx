import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { GlobalNoticeBanner } from "./GlobalNoticeBanner";
import { OnboardingTour } from "@/components/features/OnboardingTour";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, X } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const teamSlug = useOptionalTeamSlug();
  const { isImpersonating, stopImpersonating } = useAuth(); // Corrigidio isImpersonating

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen flex-col w-full">
        {/* Sidebar só aparece se tiver teamSlug, mas o Provider sempre existe para evitar erro no Header */}
        {teamSlug && <AppSidebar />} 
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
            <OnboardingTour />
            {isImpersonating && (
                <div className="bg-[#D4A84B] text-black py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-lg animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                    Modo Suporte Ativo: Visualizando dados do cliente
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={stopImpersonating}
                    // @ts-ignore - ignorar erro de tipagem se houver na função stopImpersonating do hook antigo
                    className="h-7 bg-black/10 hover:bg-black/20 text-black border-none font-bold text-[10px] gap-1 px-3"
                >
                    Encerrar Sessão
                    <X className="h-3 w-3" />
                </Button>
                </div>
            )}
            <GlobalNoticeBanner />
            <Header />
            <main className={`flex-1 md:pb-0 ${teamSlug ? "pb-16" : ""}`}>{children}</main>
            <Footer />
            {teamSlug && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
