import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useEffect } from "react";
import { applyTeamTheme } from "@/lib/colors";
import { ESCUDO_PADRAO } from "@/lib/constants";

export interface TeamConfig {
  id: string | null;
  nome: string;
  slug: string | null;
  escudo_url: string | null;
  banner_url: string | null;
  cidade?: string | null;
  estado?: string | null;
  invite_code?: string | null;
  owner_contact?: string | null;
  redes_sociais: {
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
    facebook?: string;
    [key: string]: string | undefined;
  };
  cores?: {
    primary?: string;
  };
  bio_config?: {
    text: string | null;
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    fontFamily: string;
    titleColor?: string;
    titleStroke?: boolean;
    titleStrokeColor?: string;
    titleStrokeWidth?: number;
    bioStroke?: boolean;
    bioStrokeColor?: string;
    bioStrokeWidth?: number;
  };
}

const DEFAULT_TEAM: TeamConfig = {
  id: null,
  nome: "FutGestor",
  slug: null,
  escudo_url: null,
  banner_url: null,
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
      team: {
        id: teamSlug.team.id,
        nome: teamSlug.team.nome,
        slug: teamSlug.team.slug,
        escudo_url: teamSlug.team.escudo_url || ESCUDO_PADRAO,
        banner_url: teamSlug.team.banner_url,
        cidade: (teamSlug.team as any).cidade,
        estado: (teamSlug.team as any).estado,
        redes_sociais: teamSlug.team.redes_sociais || {},
        cores: (teamSlug.team.cores as any),
        bio_config: teamSlug.team.bio_config,
        invite_code: teamSlug.team.invite_code,
        owner_contact: (teamSlug.team as any).owner_contact,
      } as TeamConfig,
      isLoading: false,
    };
  }

  const team: TeamConfig = teamData
    ? {
      id: teamData.id,
      nome: teamData.nome,
      slug: teamData.slug,
      escudo_url: teamData.escudo_url || ESCUDO_PADRAO,
      banner_url: (teamData as any).banner_url || null,
      cidade: (teamData as any).cidade,
      estado: (teamData as any).estado,
      redes_sociais: (teamData.redes_sociais as any) || {},
      cores: (teamData.cores as any),
      bio_config: (teamData as any).bio_config || null,
      invite_code: teamData.invite_code,
      owner_contact: (teamData as any).owner_contact || null,
    }
    : { ...DEFAULT_TEAM, escudo_url: ESCUDO_PADRAO };

  return { team, isLoading };
}
