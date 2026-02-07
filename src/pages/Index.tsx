import { Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import heroBg from "@/assets/hero-futgestor.png";

const Index = () => {
  const { user, profile, isLoading } = useAuth();
  const { team, isLoading: teamLoading } = useTeamConfig();

  // Redirect logged-in users with a team to their team page
  if (!isLoading && !teamLoading && user && profile?.team_id && team.slug) {
    return <Navigate to={`/time/${team.slug}`} replace />;
  }

  return (
    <Layout>
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="container relative z-10 flex min-h-[600px] md:min-h-[700px] items-center justify-center px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              FutGestor
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-white/80">
              A plataforma completa para gestão do seu time de futebol. Agenda, escalações, resultados, finanças e muito mais em um só lugar.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {user ? (
                profile?.team_id ? null : (
                  <Link to="/onboarding">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Criar meu time
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Entrar
                    </Button>
                  </Link>
                   <Link to="/auth?tab=signup&redirect=onboarding">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Criar meu time
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
