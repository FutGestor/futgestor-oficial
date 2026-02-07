import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";

export interface TeamConfig {
  id: string | null;
  nome: string;
  slug: string | null;
  escudo_url: string | null;
  redes_sociais: {
    instagram?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
}

const DEFAULT_TEAM: TeamConfig = {
  id: null,
  nome: "FutGestor",
  slug: null,
  escudo_url: null,
  redes_sociais: {},
};

export function useTeamConfig() {
  const teamSlug = useOptionalTeamSlug();
  const { profile } = useAuth();
  const teamId = profile?.team_id;

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["team-config", teamId],
    enabled: !!teamId && !teamSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (teamSlug?.team) {
    return {
      team: {
        id: teamSlug.team.id,
        nome: teamSlug.team.nome,
        slug: teamSlug.team.slug,
        escudo_url: teamSlug.team.escudo_url,
        redes_sociais: teamSlug.team.redes_sociais || {},
      } as TeamConfig,
      isLoading: false,
    };
  }

  const team: TeamConfig = teamData
    ? {
        id: teamData.id,
        nome: teamData.nome,
        slug: teamData.slug,
        escudo_url: teamData.escudo_url,
        redes_sociais: (teamData.redes_sociais as any) || {},
      }
    : DEFAULT_TEAM;

  return { team, isLoading };
}
