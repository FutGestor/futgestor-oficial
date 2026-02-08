import { createContext, useContext, useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

export interface TeamSlugData {
  id: string;
  nome: string;
  slug: string;
  escudo_url: string | null;
  banner_url: string | null;
  cores: any;
  redes_sociais: Record<string, string>;
}

interface TeamSlugContextType {
  slug: string;
  team: TeamSlugData;
  basePath: string;
}

const TeamSlugContext = createContext<TeamSlugContextType | null>(null);

export function TeamSlugLayout() {
  const { slug } = useParams<{ slug: string }>();

  const { data: teamData, isLoading, isError } = useQuery({
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
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Erro ao carregar</h1>
          <p className="mb-4 text-muted-foreground">Não foi possível carregar os dados do time.</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Voltar ao início</a>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return <NotFound />;
  }

  const value: TeamSlugContextType = {
    slug: slug!,
    team: {
      id: teamData.id,
      nome: teamData.nome,
      slug: teamData.slug,
      escudo_url: teamData.escudo_url,
      banner_url: (teamData as any).banner_url || null,
      cores: teamData.cores,
      redes_sociais: (teamData.redes_sociais as Record<string, string>) || {},
    },
    basePath: `/time/${slug}`,
  };

  useEffect(() => {
    if (slug) {
      localStorage.setItem("lastTeamSlug", slug);
    }
  }, [slug]);

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
