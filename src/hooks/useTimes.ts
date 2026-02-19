import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Time } from "@/lib/types";

// Busca todos os times (filtrado por team_id)
export function useTimes(teamId?: string | null) {
  return useQuery({
    queryKey: ["times", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .eq("team_id", teamId!)
        .order("nome");

      if (error) throw error;
      return data as Time[];
    },
    enabled: !!teamId,
  });
}

// Busca APENAS adversários (is_casa = false) - para não confundir com o próprio time
export function useTimesAdversarios(teamId?: string | null) {
  return useQuery({
    queryKey: ["times", "adversarios", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .eq("team_id", teamId!)
        .eq("is_casa", false)  // Só adversários, não o próprio time
        .order("nome");

      if (error) throw error;
      return data as Time[];
    },
    enabled: !!teamId,
  });
}

// Busca apenas times ativos (filtrado por team_id)
export function useTimesAtivos(teamId?: string | null) {
  return useQuery({
    queryKey: ["times", "ativos", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*, adversary_team:teams(escudo_url)")
        .eq("team_id", teamId!)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data as any[];
    },
    enabled: !!teamId,
  });
}

// Busca o time da casa (filtrado por team_id)
export function useTimeCasa(teamId?: string | null) {
  return useQuery({
    queryKey: ["times", "casa", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*, adversary_team:teams(escudo_url)")
        .eq("team_id", teamId!)
        .eq("is_casa", true)
        .maybeSingle();

      if (error) throw error;
      return data as any | null;
    },
    enabled: !!teamId,
  });
}

// Criar time
export function useCreateTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (time: Omit<Time, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("times")
        .insert(time)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["times"] });
    },
  });
}

// Atualizar time
export function useUpdateTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...time }: Partial<Time> & { id: string }) => {
      const { data, error } = await supabase
        .from("times")
        .update(time)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["times"] });
    },
  });
}

// Deletar time (com desvinculação de jogos)
export function useDeleteTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro, desvincular o time de todos os jogos
      const { error: updateError } = await supabase
        .from("jogos")
        .update({ time_adversario_id: null })
        .eq("time_adversario_id", id);

      if (updateError) throw updateError;

      // Depois, deletar o time
      const { error: deleteError } = await supabase
        .from("times")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["times"] });
      queryClient.invalidateQueries({ queryKey: ["jogos"] });
    },
  });
}
