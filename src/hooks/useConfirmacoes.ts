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
      // Buscar jogos futuros primeiro
      const { data: jogosFuturos } = await supabase
        .from("jogos")
        .select("id")
        .gte("data_hora", new Date().toISOString());
      
      if (!jogosFuturos?.length) return [];

      const jogoIds = jogosFuturos.map(j => j.id);

      // Buscar confirmações desses jogos
      const { data: confirmacoes, error } = await supabase
        .from("confirmacoes_presenca")
        .select("*")
        .in("jogo_id", jogoIds);

      if (error) throw error;
      if (!confirmacoes?.length) return [];

      // Buscar dados dos jogadores
      const jogadorIds = [...new Set(confirmacoes.map(c => c.jogador_id).filter(Boolean))];
      const { data: jogadores } = await supabase
        .from("jogadores")
        .select("*")
        .in("id", jogadorIds);

      // Buscar dados dos jogos
      const { data: jogos } = await supabase
        .from("jogos")
        .select("*")
        .in("id", jogoIds);

      const jogadoresMap = new Map(jogadores?.map(j => [j.id, j]) || []);
      const jogosMap = new Map(jogos?.map(j => [j.id, j]) || []);

      // Juntar dados
      return confirmacoes.map(c => ({
        ...c,
        jogador: jogadoresMap.get(c.jogador_id) || null,
        jogo: jogosMap.get(c.jogo_id) || null,
      }));
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
      teamId,
    }: {
      jogoId: string;
      jogadorId: string;
      status: PresenceStatus;
      teamId: string;
    }) => {
      // Upsert - insere ou atualiza
      const { error } = await supabase.from("confirmacoes_presenca").upsert(
        {
          jogo_id: jogoId,
          jogador_id: jogadorId,
          status,
          team_id: teamId,
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
