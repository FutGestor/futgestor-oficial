import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Time } from "@/lib/types";

// Busca todos os times
export function useTimes() {
  return useQuery({
    queryKey: ["times"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Time[];
    },
  });
}

// Busca apenas times ativos
export function useTimesAtivos() {
  return useQuery({
    queryKey: ["times", "ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data as Time[];
    },
  });
}

// Busca o time da casa
export function useTimeCasa() {
  return useQuery({
    queryKey: ["times", "casa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .eq("is_casa", true)
        .maybeSingle();

      if (error) throw error;
      return data as Time | null;
    },
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
