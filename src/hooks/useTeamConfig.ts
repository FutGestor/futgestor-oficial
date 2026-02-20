import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useEffect } from "react";
import { applyTeamTheme } from "@/lib/colors";
import { ESCUDO_PADRAO } from "@/lib/constants";
import type { TeamConfig, Team, TeamColors, TeamRedesSociais, TeamBioConfig } from "@/types/team";

export type { TeamConfig, TeamColors, TeamRedesSociais, TeamBioConfig };

const DEFAULT_TEAM: TeamConfig = {
  id: null,
  nome: "FutGestor",
  slug: null,
  escudo_url: null,
  banner_url: null,
  cidade: null,
  estado: null,
  invite_code: null,
  owner_contact: null,
  redes_sociais: {},
  cores: null,
  bio_config: null,
};

// Helper para converter dados do Supabase para TeamConfig
function parseTeamData(data: Team | null): TeamConfig {
  if (!data) return { ...DEFAULT_TEAM, escudo_url: ESCUDO_PADRAO };
  
  return {
    id: data.id,
    nome: data.nome,
    slug: data.slug,
    escudo_url: data.escudo_url || ESCUDO_PADRAO,
    banner_url: data.banner_url,
    cidade: data.cidade,
    estado: data.estado,
    invite_code: data.invite_code,
    owner_contact: data.owner_contact,
    redes_sociais: data.redes_sociais || {},
    cores: data.cores,
    bio_config: data.bio_config,
  };
}

// Helper para converter dados do TeamSlug para TeamConfig
function parseTeamSlugData(team: Team): TeamConfig {
  return {
    id: team.id,
    nome: team.nome,
    slug: team.slug,
    escudo_url: team.escudo_url || ESCUDO_PADRAO,
    banner_url: team.banner_url,
    cidade: team.cidade,
    estado: team.estado,
    invite_code: team.invite_code,
    owner_contact: team.owner_contact,
    redes_sociais: team.redes_sociais || {},
    cores: team.cores,
    bio_config: team.bio_config,
  };
}

export function useTeamConfig() {
  const teamSlug = useOptionalTeamSlug();
  const { profile } = useAuth();
  const teamId = profile?.team_id;

  const { data: teamData, isLoading } = useQuery<Team | null>({
    queryKey: ["team-config", teamId],
    enabled: !!teamId && !teamSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId!)
        .maybeSingle();
      if (error) throw error;
      return data as Team | null;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Apply team theme globaly
  useEffect(() => {
    const primaryColor = teamSlug?.team.cores?.primary || teamData?.cores?.primary;
    if (primaryColor) {
      applyTeamTheme(primaryColor);
    }
  }, [teamSlug?.team.cores?.primary, teamData?.cores?.primary]);

  if (teamSlug?.team) {
    return {
      team: parseTeamSlugData(teamSlug.team as Team),
      isLoading: false,
    };
  }

  const team = parseTeamData(teamData);

  return { team, isLoading };
}
