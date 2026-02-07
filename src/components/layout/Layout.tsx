import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const teamSlug = useOptionalTeamSlug();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`flex-1 md:pb-0 ${teamSlug ? "pb-16" : ""}`}>{children}</main>
      <Footer />
      {teamSlug && <MobileBottomNav />}
    </div>
  );
}
