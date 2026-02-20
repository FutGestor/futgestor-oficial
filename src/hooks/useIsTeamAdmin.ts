import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook para verificar se o usuário logado é admin do time especificado
 * Retorna true se o usuário for admin, super_admin ou god_admin do time
 */
export function useIsTeamAdmin(teamId?: string) {
  const { user, isGodAdmin } = useAuth();

  return useQuery({
    queryKey: ["is-team-admin", teamId, user?.id],
    enabled: !!teamId && !!user,
    queryFn: async () => {
      // God admin sempre tem permissão
      if (isGodAdmin) return true;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("team_id", teamId!)
        .in("role", ["admin", "super_admin"]);

      if (error) {
        console.error("Erro ao verificar permissão de admin:", error);
        return false;
      }

      return data && data.length > 0;
    },
  });
}
