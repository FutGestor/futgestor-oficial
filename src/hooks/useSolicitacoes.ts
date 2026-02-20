import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type RequestStatus = "pendente" | "aceita" | "recusada";

export interface SolicitacaoJogo {
  id: string;
  nome_time: string;
  email_contato: string;
  telefone_contato: string | null;
  data_preferida: string;
  horario_preferido: string;
  local_sugerido: string;
  observacoes: string | null;
  mensagem: string | null;
  time_solicitante_id: string | null;
  user_solicitante_id: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  time_solicitante?: {
    nome: string;
    escudo_url: string | null;
    slug: string;
  };
}

export function useSolicitacoes(status?: RequestStatus, teamId?: string) {
  return useQuery({
    queryKey: ["solicitacoes", status, teamId],
    enabled: !!teamId,
    queryFn: async () => {
      let query = supabase
        .from("solicitacoes_jogo")
        .select("*, time_solicitante:teams!time_solicitante_id(nome, escudo_url, slug)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as SolicitacaoJogo[];
    },
  });
}

export function useSolicitacoesPendentesCount(teamId?: string) {
  return useQuery({
    queryKey: ["solicitacoes", "pendentes", "count", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("solicitacoes_jogo")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId!)
        .eq("status", "pendente");

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCreateSolicitacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      nome_time: string;
      email_contato?: string;
      telefone_contato: string;
      data_preferida: string;
      horario_preferido: string;
      local_sugerido: string;
      observacoes?: string;
      team_id?: string;
    }) => {
      const response = await supabase.functions.invoke("create-solicitacao", {
        body: {
          ...data,
          time_solicitante_id: profile?.team_id || null,
          user_solicitante_id: profile?.id || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar solicitação");
      }

      const result = response.data;
      if (result?.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Aguarde o contato do nosso time.",
      });
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSolicitacaoStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: RequestStatus;
    }) => {
      const { error } = await supabase
        .from("solicitacoes_jogo")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSolicitacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("solicitacoes_jogo")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação excluída",
      });
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// REALTIME - Atualizações em tempo real
// ============================================

/**
 * Hook para escutar novas solicitações em tempo real
 * Atualiza o cache do React Query quando uma nova solicitação é inserida
 */
export function useSolicitacoesRealtime(teamId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`solicitacoes-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "solicitacoes_jogo",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          // Invalidar queries para forçar atualização
          queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "solicitacoes_jogo",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "solicitacoes_jogo",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);
}
