import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { GlobalNoticeBanner } from "./GlobalNoticeBanner";
import { DynamicBackground } from "./DynamicBackground";
import { SupportModeBanner } from "./SupportModeBanner";
import { SolicitacaoAlert } from "@/components/SolicitacaoAlert";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useTeamConfig } from "@/hooks/useTeamConfig";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { team, isLoading } = useTeamConfig();
  const teamSlugValue = team?.slug;

  return (
    <div className="relative flex min-h-screen flex-col selection:bg-primary/20">
      <DynamicBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SupportModeBanner />
        <GlobalNoticeBanner />
        <SolicitacaoAlert />
        <Header />
        <main className={`flex-1 md:pb-0 ${teamSlugValue ? "pb-16" : ""}`}>
          <div className="relative px-0">
            {children}
          </div>
        </main>
        <Footer />
        {teamSlugValue && <MobileBottomNav />}
      </div>
    </div>
  );
}
