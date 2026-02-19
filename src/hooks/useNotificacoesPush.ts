import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotificacaoPush {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'escalacao_pendente' | 'jogo_hoje' | 'confirmacao_presenca' | 'escalacao_confirmada';
  dados: {
    jogo_id?: string;
    escalacao_id?: string;
    data_hora?: string;
    adversario?: string;
  };
  lida: boolean;
  enviada: boolean;
  created_at: string;
}

export function useNotificacoesNaoLidas(userId: string | undefined) {
  return useQuery({
    queryKey: ["notificacoes", "nao-lidas", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes_push")
        .select("*")
        .eq("user_id", userId)
        .eq("lida", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NotificacaoPush[];
    },
  });
}

export function useNotificacoesJogoHoje(userId: string | undefined) {
  return useQuery({
    queryKey: ["notificacoes", "jogo-hoje", userId],
    enabled: !!userId,
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("notificacoes_push")
        .select("*")
        .eq("user_id", userId)
        .eq("tipo", "jogo_hoje")
        .eq("lida", false)
        .gte("created_at", hoje)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NotificacaoPush[];
    },
  });
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from("notificacoes_push")
        .update({ lida: true, updated_at: new Date().toISOString() })
        .eq("id", notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useCriarNotificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificacao: {
      user_id: string;
      titulo: string;
      mensagem: string;
      tipo: NotificacaoPush['tipo'];
      dados?: NotificacaoPush['dados'];
    }) => {
      const { data, error } = await supabase
        .from("notificacoes_push")
        .insert({
          ...notificacao,
          enviada: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

// Hook para verificar se há jogos hoje sem escalação confirmada
export function useJogosHojeSemEscalacao(teamId: string | undefined) {
  return useQuery({
    queryKey: ["jogos-hoje-sem-escalacao", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("jogos")
        .select(`
          id,
          adversario,
          data_hora,
          local,
          escalacoes(id, status_escalacao)
        `)
        .eq("time_id", teamId)
        .gte("data_hora", hojeInicio.toISOString())
        .lte("data_hora", hojeFim.toISOString())
        .order("data_hora", { ascending: true });

      if (error) throw error;

      // Filtrar jogos sem escalação confirmada
      return data?.filter(jogo => {
        const escalacao = jogo.escalacoes?.[0];
        return !escalacao || escalacao.status_escalacao !== 'confirmada';
      }) || [];
    },
  });
}
