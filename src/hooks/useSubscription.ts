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
  mp_subscription_id: string | null;
  mp_preference_id: string | null;
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
          mp_subscription_id: null,
          mp_preference_id: null,
          created_at: new Date().toISOString(),
          expires_at: null,
        } as Subscription;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
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

  const isActive = subscription?.status === "active";
  const plan: PlanType = isActive ? (subscription?.plano as PlanType) ?? "free" : "free";

  return { plan, isLoading, subscription, isActive };
}

/** Check if a feature is accessible for the current plan */
export function usePlanAccess(teamId?: string | null) {
  const { plan, isLoading, isActive } = useCurrentPlan(teamId);

  const PLAN_HIERARCHY: Record<PlanType, number> = {
    free: 0,
    basico: 1,
    pro: 2,
    liga: 3,
  };

  const planLevel = PLAN_HIERARCHY[plan] ?? 0;

  return {
    plan,
    isLoading,
    isActive,
    // Feature checks
    hasDashboard: planLevel >= 1,
    hasJogos: planLevel >= 1,
    hasEscalacao: planLevel >= 1,
    hasResultados: planLevel >= 1,
    hasFinanceiro: planLevel >= 2, // pro+
    hasAvisos: planLevel >= 2, // pro+
    hasConvidarJogador: planLevel >= 3, // liga
    hasLoginJogadores: planLevel >= 3, // liga
    hasCampeonatos: planLevel >= 3, // liga
    hasSaldoCard: planLevel >= 2, // pro+
    // Utility
    canAccess: (requiredPlan: PlanType) => planLevel >= (PLAN_HIERARCHY[requiredPlan] ?? 0),
  };
}

// Keep backward compat
export function useIsProPlan(teamId?: string | null) {
  const { plan, isLoading, subscription } = useCurrentPlan(teamId);
  const isPro = plan === "pro" || plan === "liga";
  return { isPro, isLoading, subscription };
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
