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

  useEffect(() => {
    if (slug) {
      localStorage.setItem("lastTeamSlug", slug);
    }
  }, [slug]);

  // Apply team theme
  useEffect(() => {
    const cores = teamData?.cores as any;
    if (cores?.primary) {
      const primaryColor = cores.primary;

      // Helper to convert hex to HSL for Tailwind
      const hexToHSL = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;

        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);

        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0; // achromatic
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      const primaryHSL = hexToHSL(primaryColor);

      if (primaryHSL) {
        document.documentElement.style.setProperty('--primary', primaryHSL);

        // Calculate contrast for foreground
        // Formula for luminance: 0.299*R + 0.587*G + 0.114*B
        const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(primaryColor);
        if (rgb) {
          const r = parseInt(rgb[1], 16);
          const g = parseInt(rgb[2], 16);
          const b = parseInt(rgb[3], 16);

          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          // If dark background (low luminance), use light text. Else use dark text.
          // Using strict 0.5 cutoff.
          const foregroundHSL = luminance > 0.5 ? "210 52% 10%" : "0 0% 100%"; // Dark navy or White

          document.documentElement.style.setProperty('--primary-foreground', foregroundHSL);
        }
      }
    }
  }, [teamData]);


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
