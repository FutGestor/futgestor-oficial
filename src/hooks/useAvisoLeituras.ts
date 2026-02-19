import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAvisoLeituras() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["aviso-leituras", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aviso_leituras")
        .select("aviso_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((r) => r.aviso_id));
    },
  });
}

export function useAvisosNaoLidos(teamId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["avisos-nao-lidos", user?.id, teamId],
    enabled: !!user && !!teamId,
    queryFn: async () => {
      // Get all published avisos for the specific team
      const { data: avisos, error: avisosErr } = await supabase
        .from("avisos")
        .select("id")
        .eq("publicado", true)
        .eq("team_id", teamId!);
      if (avisosErr) throw avisosErr;

      if (avisos.length === 0) return 0;

      // Get user's read avisos
      const { data: leituras, error: leiturasErr } = await supabase
        .from("aviso_leituras")
        .select("aviso_id")
        .eq("user_id", user!.id);
      if (leiturasErr) throw leiturasErr;

      const lidosSet = new Set(leituras.map((l) => l.aviso_id));
      return avisos.filter((a) => !lidosSet.has(a.id)).length;
    },
  });
}

export function useMarcarAvisoLido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avisoId: string) => {
      const { error } = await supabase
        .from("aviso_leituras")
        .upsert(
          { aviso_id: avisoId, user_id: user!.id },
          { onConflict: "aviso_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aviso-leituras"] });
      queryClient.invalidateQueries({ queryKey: ["avisos-nao-lidos"] });
    },
  });
}

export function useMarcarTodosLidos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avisoIds: string[]) => {
      const rows = avisoIds.map((aviso_id) => ({
        aviso_id,
        user_id: user!.id,
      }));
      const { error } = await supabase
        .from("aviso_leituras")
        .upsert(rows, { onConflict: "aviso_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aviso-leituras"] });
      queryClient.invalidateQueries({ queryKey: ["avisos-nao-lidos"] });
    },
  });
}

// Hook para excluir aviso (apenas admins)
export function useExcluirAviso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avisoId: string) => {
      const { error } = await supabase
        .from("avisos")
        .delete()
        .eq("id", avisoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
      queryClient.invalidateQueries({ queryKey: ["aviso-leituras"] });
      queryClient.invalidateQueries({ queryKey: ["avisos-nao-lidos"] });
    },
  });
}
