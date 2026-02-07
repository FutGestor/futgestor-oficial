import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { profile } = useAuth();
  const effectiveTeamId = teamId || profile?.team_id;

  return useQuery({
    queryKey: ["subscription", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
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

export function useIsProPlan(teamId?: string | null) {
  const { data: subscription, isLoading } = useSubscription(teamId);
  
  const isPro = subscription?.status === "active" && subscription?.plano === "pro";
  
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
