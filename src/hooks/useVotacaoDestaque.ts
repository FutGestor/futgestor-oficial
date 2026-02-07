import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface VotoDestaque {
  id: string;
  resultado_id: string;
  votante_id: string;
  jogador_id: string;
  created_at: string;
  updated_at: string;
}

// Buscar todos os votos de um resultado

// Buscar todos os votos de um resultado
export function useVotosDestaque(resultadoId: string | undefined) {
  return useQuery({
    queryKey: ["votos-destaque", resultadoId],
    queryFn: async () => {
      if (!resultadoId) return [];
      
      const { data, error } = await supabase
        .from("votos_destaque")
        .select("*")
        .eq("resultado_id", resultadoId);

      if (error) throw error;
      return data as VotoDestaque[];
    },
    enabled: !!resultadoId,
  });
}

// Buscar voto do usuário atual
export function useMeuVoto(resultadoId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meu-voto", resultadoId, user?.id],
    queryFn: async () => {
      if (!resultadoId || !user) return null;

      const { data, error } = await supabase
        .from("votos_destaque")
        .select("*")
        .eq("resultado_id", resultadoId)
        .eq("votante_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as VotoDestaque | null;
    },
    enabled: !!resultadoId && !!user,
  });
}

// Contagem de votos por jogador
export function useContagemVotos(resultadoId: string | undefined) {
  const { data: votos } = useVotosDestaque(resultadoId);

  // Agrupa votos por jogador
  const contagem: Record<string, number> = {};
  votos?.forEach((voto) => {
    contagem[voto.jogador_id] = (contagem[voto.jogador_id] || 0) + 1;
  });

  return {
    contagem,
    total: votos?.length || 0,
  };
}

// Mutation para votar
export function useVotar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      resultadoId,
      jogadorId,
    }: {
      resultadoId: string;
      jogadorId: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Verifica se já votou neste resultado
      const { data: existingVote } = await supabase
        .from("votos_destaque")
        .select("id")
        .eq("resultado_id", resultadoId)
        .eq("votante_id", user.id)
        .maybeSingle();

      if (existingVote) {
        // Atualiza voto existente
        const { error } = await supabase
          .from("votos_destaque")
          .update({ jogador_id: jogadorId })
          .eq("id", existingVote.id);

        if (error) throw error;
        return { action: "updated" };
      } else {
        // Insere novo voto
        const { error } = await supabase
          .from("votos_destaque")
          .insert({
            resultado_id: resultadoId,
            votante_id: user.id,
            jogador_id: jogadorId,
          });

        if (error) throw error;
        return { action: "inserted" };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["votos-destaque", variables.resultadoId],
      });
      queryClient.invalidateQueries({
        queryKey: ["meu-voto", variables.resultadoId],
      });
      toast.success(
        result.action === "updated"
          ? "Voto atualizado com sucesso!"
          : "Voto registrado com sucesso!"
      );
    },
    onError: (error: Error) => {
      console.error("Erro ao votar:", error);
      toast.error("Erro ao registrar voto. Tente novamente.");
    },
  });
}

// Buscar jogadores que participaram de uma partida
export function useJogadoresPartida(resultadoId: string | undefined) {
  return useQuery({
    queryKey: ["jogadores-partida", resultadoId],
    queryFn: async () => {
      if (!resultadoId) return [];

      const { data, error } = await supabase
        .from("estatisticas_partida")
        .select(`
          jogador_id,
          jogador:jogadores(
            id,
            nome,
            apelido,
            foto_url,
            posicao,
            numero
          )
        `)
        .eq("resultado_id", resultadoId)
        .eq("participou", true);

      if (error) throw error;
      return data;
    },
    enabled: !!resultadoId,
  });
}
