import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Trophy, Bell, Shield, LayoutDashboard, CalendarPlus, Award, BarChart3, Users, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/useSubscription";
import { RecentAchievements } from "@/components/public/RecentAchievements";
import { FeaturedGameCard } from "@/components/public/FeaturedGameCard";
import { QuickAccessCard } from "@/components/public/QuickAccessCard";
import { ChallengeLinkCard } from "@/components/public/ChallengeLinkCard";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

export default function TeamPublicPage() {
  const { team, basePath } = useTeamSlug();
  const { isAdmin } = useAuth();
  const { hasSolicitacoes, hasAvisos, hasCampeonatos } = usePlanAccess(team.id);

  return (
    <Layout>
      {/* Onboarding Checklist for Admins */}
      {isAdmin && (
        <section className="container px-4 pt-10 pb-0 relative z-20 mb-[-2rem]">
          <OnboardingChecklist teamId={team.id} escudoUrl={team.escudo_url} />
        </section>
      )}

      {/* Quick Access Navigation Section */}
      <section className="container px-4 pt-10 pb-6 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isAdmin && hasSolicitacoes && <QuickAccessCard to={`${basePath}/solicitacoes`} icon={CalendarPlus} label="Solicitações" />}
          <QuickAccessCard to={`${basePath}/jogadores`} icon={Users} label="Jogadores" />
          <QuickAccessCard to={`${basePath}/escalacao`} icon={Shield} label="Escalação" />
          {hasCampeonatos && <QuickAccessCard to={`${basePath}/ligas`} icon={Award} label="Ligas" />}
          <QuickAccessCard to={`${basePath}/resultados`} icon={BarChart3} label="Resultados" />
          <QuickAccessCard to={`${basePath}/banners`} icon={ImageIcon} label="Banners" />
          {isAdmin && <QuickAccessCard to={`${basePath}/gestao`} icon={LayoutDashboard} label="Gestão" className="bg-primary/10 border-primary/20" />}
        </div>
      </section>

      <div className="container px-4 md:px-6 relative z-20 space-y-12 mb-24">
        
        {/* 1. Featured Game (Floating over Hero) */}
        <section>
             <h2 className="sr-only">Destaque</h2>
             <div className="max-w-3xl mx-auto space-y-12">
                <FeaturedGameCard teamId={team.id} />
                <RecentAchievements teamId={team.id} />
             </div>
        </section>

        {/* Link de Desafio - Apenas para Admins */}
        {isAdmin && (
            <section className="max-w-3xl mx-auto space-y-4">
                <ChallengeLinkCard teamSlug={team.slug} />
            </section>
        )}
      </div>
    </Layout>
  );
}
