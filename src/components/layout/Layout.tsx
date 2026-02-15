import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { GlobalNoticeBanner } from "./GlobalNoticeBanner";
import { DynamicBackground } from "./DynamicBackground";
import { SupportModeBanner } from "./SupportModeBanner";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useTeamConfig } from "@/hooks/useTeamConfig";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const teamSlug = useOptionalTeamSlug();
  const { team } = useTeamConfig(); // This hook now applies the team theme globaly via useEffect

  return (
    <div className="flex min-h-screen flex-col selection:bg-primary/20">
      <DynamicBackground />
      <SupportModeBanner />
      <GlobalNoticeBanner />
      <Header />
      <main className={`flex-1 md:pb-0 ${teamSlug ? "pb-16" : ""}`}>
        <div className="relative px-0 bg-transparent">
          {children}
        </div>
      </main>
      <Footer />
      {teamSlug && <MobileBottomNav />}
    </div>
  );
}
