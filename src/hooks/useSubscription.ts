import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";

// God mode whitelist - these emails always get full access (liga plan)
const GOD_MODE_EMAILS = ["tuckmantel86@gmail.com", "futgestor@gmail.com"];

export type PlanType = "basico" | "pro" | "liga" | "free";

export interface Subscription {
  id: string;
  team_id: string;
  plano: string;
  status: string;
  created_at: string;
  expires_at: string | null;
}

export function useSubscription(teamId?: string | null) {
  const { profile, user } = useAuth();
  const effectiveTeamId = teamId || profile?.team_id;
  const isGodMode = GOD_MODE_EMAILS.includes(user?.email?.toLowerCase() ?? "");
  const isSimulating = typeof window !== "undefined" && localStorage.getItem("simulatingPlan") === "true";

  return useQuery({
    queryKey: ["subscription", effectiveTeamId, isGodMode, isSimulating],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      // God mode: return fake liga subscription (unless simulating)
      if (isGodMode && !isSimulating) {
        return {
          id: "god-mode",
          team_id: effectiveTeamId!,
          plano: "liga",
          status: "active",
          created_at: new Date().toISOString(),
          expires_at: null,
        } as Subscription;
      }

      // Use RPC to bypass RLS for public pages
      const { data, error } = await supabase
        .rpc("get_public_subscription", { _team_id: effectiveTeamId });

      if (error) throw error;
      return data as unknown as Subscription | null;
    },
  });
}

export function useCurrentPlan(teamId?: string | null): {
  plan: PlanType;
  isLoading: boolean;
  subscription: Subscription | null | undefined;
  isActive: boolean;
} {
  const { data: subscription, isLoading } = useSubscription(teamId);

  // Forza plano liga para todos (Acesso Total)
  const isActive = true;
  const plan: PlanType = "liga";

  return { plan, isLoading, subscription, isActive };
}

/** Check if a feature is accessible for the current plan */
export function usePlanAccess(teamId?: string | null) {
  const { isLoading } = useCurrentPlan(teamId);

  return {
    plan: "liga" as PlanType,
    isLoading,
    isActive: true,
    // Feature checks - All true for Total Access
    hasDashboard: true,
    hasJogos: true,
    hasEscalacao: true,
    hasResultados: true,
    hasRanking: true,
    hasPresenca: true,
    hasSolicitacoes: true,
    hasEstatisticasAvancadas: true,
    hasFinanceiro: true,
    hasAvisos: true,
    hasConvidarJogador: true,
    hasLoginJogadores: true,
    hasCampeonatos: true,
    hasSaldoCard: true,
    hasVotacaoCraque: true,
    hasAlbumFigurinhas: true,
    // Utility
    canAccess: () => true,
  };
}

// Keep backward compat
export function useIsProPlan(teamId?: string | null) {
  const { isLoading, subscription } = useCurrentPlan(teamId);
  return { isPro: true, isLoading, subscription };
}

export function useCreateMpPreference() {
  return useMutation({
    mutationFn: async (params: {
      plano: string;
      team_id: string;
      success_url?: string;
      failure_url?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-mp-preference", {
        body: params,
      });
      if (error) throw error;
      return data as { init_point: string; preference_id: string };
    },
  });
}
