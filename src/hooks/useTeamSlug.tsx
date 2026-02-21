import { createContext, useContext, useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { LoadingScreen } from "@/components/LoadingScreen";
import { applyTeamTheme } from "@/lib/colors";
import { ESCUDO_PADRAO } from "@/lib/constants";
import type { Team, TeamSlugData, TeamColors, TeamRedesSociais, TeamBioConfig } from "@/types/team";

export type { TeamSlugData, TeamColors, TeamRedesSociais, TeamBioConfig };

interface TeamSlugContextType {
  slug: string;
  team: TeamSlugData;
  basePath: string;
}

const TeamSlugContext = createContext<TeamSlugContextType | null>(null);

// Helper para converter dados do Supabase para TeamSlugData
function parseTeamSlugData(data: Team, slug: string): TeamSlugData {
  return {
    id: data.id,
    nome: data.nome,
    slug: data.slug,
    escudo_url: data.escudo_url || ESCUDO_PADRAO,
    banner_url: data.banner_url,
    cidade: data.cidade,
    estado: data.estado,
    cores: data.cores,
    invite_code: data.invite_code,
    owner_contact: data.owner_contact,
    redes_sociais: data.redes_sociais || {},
    bio_config: data.bio_config,
  };
}

export function TeamSlugLayout() {
  const { slug } = useParams<{ slug: string }>();

  const { data: teamData, isLoading, isError } = useQuery<Team | null>({
    queryKey: ["team-by-slug", slug],
    enabled: !!slug,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Team | null;
    },
  });

  useEffect(() => {
    if (slug) {
      localStorage.setItem("lastTeamSlug", slug);
    }
  }, [slug]);

  // Theme is now handled globaly by useTeamConfig

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040810]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">Erro ao carregar</h1>
          <p className="mb-4 text-white/60">Não foi possível carregar os dados do time.</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Voltar ao início</a>
        </div>
      </div>
    );
  }

  if (!teamData || !slug) {
    return <NotFound />;
  }

  const value: TeamSlugContextType = {
    slug: slug,
    team: parseTeamSlugData(teamData, slug),
    basePath: `/time/${slug}`,
  };

  return (
    <TeamSlugContext.Provider value={value}>
      <Outlet />
    </TeamSlugContext.Provider>
  );
}

export function useTeamSlug() {
  const context = useContext(TeamSlugContext);
  if (!context) {
    throw new Error("useTeamSlug must be used within a TeamSlugLayout");
  }
  return context;
}

export function useOptionalTeamSlug() {
  return useContext(TeamSlugContext);
}
