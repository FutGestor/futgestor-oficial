import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export function useSolicitacoes(status?: RequestStatus) {
  return useQuery({
    queryKey: ["solicitacoes", status],
    queryFn: async () => {
      let query = supabase
        .from("solicitacoes_jogo")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SolicitacaoJogo[];
    },
  });
}

export function useSolicitacoesPendentesCount() {
  return useQuery({
    queryKey: ["solicitacoes", "pendentes", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("solicitacoes_jogo")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCreateSolicitacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      captcha_answer: number;
      captcha_expected: number;
    }) => {
      const response = await supabase.functions.invoke("create-solicitacao", {
        body: data,
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
