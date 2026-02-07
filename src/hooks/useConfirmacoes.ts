import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConfirmacaoPresenca, Jogador, PresenceStatus } from "@/lib/types";

// Confirmações de um jogo específico
export function useConfirmacoesJogo(jogoId: string | undefined) {
  return useQuery({
    queryKey: ["confirmacoes", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmacoes_presenca")
        .select(`*, jogador:jogadores(*)`)
        .eq("jogo_id", jogoId)
        .order("status");
      if (error) throw error;
      return data as (ConfirmacaoPresenca & { jogador: Jogador })[];
    },
  });
}

// Resumo de confirmações de todos os jogos futuros
export function useConfirmacoesFuturas() {
  return useQuery({
    queryKey: ["confirmacoes-futuras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmacoes_presenca")
        .select(`*, jogador:jogadores(*), jogo:jogos!inner(*)`)
        .gte("jogo.data_hora", new Date().toISOString());
      if (error) throw error;
      return data;
    },
  });
}

// Contagem de confirmações por jogo
export function useConfirmacoesContagem(jogoId: string | undefined) {
  return useQuery({
    queryKey: ["confirmacoes-contagem", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmacoes_presenca")
        .select("status")
        .eq("jogo_id", jogoId);
      if (error) throw error;

      const confirmados = data.filter((c) => c.status === "confirmado").length;
      const indisponiveis = data.filter((c) => c.status === "indisponivel").length;
      const pendentes = data.filter((c) => c.status === "pendente").length;

      return { confirmados, indisponiveis, pendentes, total: data.length };
    },
  });
}

// Mutação para confirmar/atualizar presença
export function useConfirmarPresenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jogoId,
      jogadorId,
      status,
    }: {
      jogoId: string;
      jogadorId: string;
      status: PresenceStatus;
    }) => {
      // Upsert - insere ou atualiza
      const { error } = await supabase.from("confirmacoes_presenca").upsert(
        {
          jogo_id: jogoId,
          jogador_id: jogadorId,
          status,
        },
        { onConflict: "jogo_id,jogador_id" }
      );
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["confirmacoes", variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-contagem", variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-futuras"] });
    },
  });
}
