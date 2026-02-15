import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamConfig } from "./useTeamConfig";

export interface SearchFilters {
  search?: string;
  cidade?: string;
  estado?: string;
}

export function usePublicTeams(filters: SearchFilters = {}, currentUserCity?: string | null, currentUserState?: string | null) {
  return useQuery({
    queryKey: ["public-teams", filters, currentUserCity, currentUserState],
    queryFn: async () => {
      let filteredQuery: any = supabase
        .from("teams")
        .select("id, nome, slug, escudo_url, banner_url, cidade, estado, redes_sociais");

      if (filters.search) {
        filteredQuery = filteredQuery.ilike("nome", `%${filters.search}%`);
      }

      if (filters.cidade) {
        filteredQuery = filteredQuery.ilike("cidade", `%${filters.cidade}%`);
      }

      if (filters.estado) {
        filteredQuery = filteredQuery.eq("estado", filters.estado.toUpperCase());
      }

      const { data, error } = await filteredQuery.order("nome");

      if (error) throw error;

      // Ordenação inteligente: 
      // 1. Mesma cidade
      // 2. Mesmo estado
      // 3. Outros
      const sortedData = [...(data || [])].sort((a, b) => {
        const aConfig = a as Partial<TeamConfig>;
        const bConfig = b as Partial<TeamConfig>;
        const aCity = aConfig.cidade?.toLowerCase();
        const bCity = bConfig.cidade?.toLowerCase();
        const aState = aConfig.estado?.toUpperCase();
        const bState = bConfig.estado?.toUpperCase();
        const myCity = currentUserCity?.toLowerCase();
        const myState = currentUserState?.toUpperCase();

        if (aCity === myCity && bCity !== myCity) return -1;
        if (bCity === myCity && aCity !== myCity) return 1;

        if (aState === myState && bState !== myState) return -1;
        if (bState === myState && aState !== myState) return 1;

        return 0;
      });

      return sortedData as Partial<TeamConfig>[];
    },
    enabled: !!filters.search && filters.search.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
