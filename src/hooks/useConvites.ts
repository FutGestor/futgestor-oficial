import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export type SolicitacaoIngresso = {
  id: string;
  jogador_user_id: string;
  jogador_nome: string;
  jogador_posicao: string;
  time_alvo_id: string;
  mensagem: string | null;
  status: "pendente" | "aceito" | "recusado";
  created_at: string;
  respondido_em: string | null;
  time?: {
    id: string;
    nome: string;
    escudo_url: string | null;
  };
};

// Hook para buscar solicitações pendentes do jogador logado
export function useMinhasSolicitacoesPendentes() {
  return useQuery({
    queryKey: ["solicitacoes-ingresso-pendentes"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("solicitacoes_ingresso")
        .select(`
          *,
          time:time_alvo_id(
            id,
            nome,
            escudo_url
          )
        `)
        .eq("jogador_user_id", user.user.id)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as SolicitacaoIngresso[];
    },
  });
}

// Hook para responder (aceitar/recusar) solicitação
export function useResponderSolicitacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      solicitacaoId,
      aceitar,
    }: {
      solicitacaoId: string;
      aceitar: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      // Buscar dados da solicitação
      const { data: solicitacao, error: fetchError } = await supabase
        .from("solicitacoes_ingresso")
        .select("*")
        .eq("id", solicitacaoId)
        .single();

      if (fetchError || !solicitacao) {
        throw new Error("Solicitação não encontrada");
      }

      // Verificar se o usuário é o jogador convidado
      if (solicitacao.jogador_user_id !== user.user.id) {
        throw new Error("Você não tem permissão para responder esta solicitação");
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from("solicitacoes_ingresso")
        .update({
          status: aceitar ? "aceito" : "recusado",
          respondido_em: new Date().toISOString(),
        })
        .eq("id", solicitacaoId);

      if (updateError) throw updateError;

      // Se aceitou, transferir jogador para o novo time
      if (aceitar) {
        // Buscar jogador atual
        const { data: jogador, error: jogadorError } = await supabase
          .from("jogadores")
          .select("*")
          .eq("user_id", user.user.id)
          .single();

        if (jogadorError || !jogador) {
          throw new Error("Jogador não encontrado");
        }

        const timeAntigoId = jogador.team_id;

        // Atualizar jogador para novo time
        const { error: transferError } = await supabase
          .from("jogadores")
          .update({
            team_id: solicitacao.time_alvo_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jogador.id);

        if (transferError) throw transferError;

        // Atualizar profile para novo time
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            team_id: solicitacao.time_alvo_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.user.id);

        if (profileError) throw profileError;

        return { 
          sucesso: true, 
          mensagem: "Você agora faz parte do novo time!",
          timeAntigoId,
          timeNovoId: solicitacao.time_alvo_id,
        };
      } else {
        return { sucesso: true, mensagem: "Convite recusado com sucesso." };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ingresso-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["jogador"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      
      // Invalidar cache de jogadores de ambos os times
      if (result.timeAntigoId) {
        queryClient.invalidateQueries({ queryKey: ["jogadores", true, result.timeAntigoId] });
        queryClient.invalidateQueries({ queryKey: ["jogadores", false, result.timeAntigoId] });
        queryClient.invalidateQueries({ queryKey: ["jogadores-publicos", result.timeAntigoId] });
      }
      if (result.timeNovoId) {
        queryClient.invalidateQueries({ queryKey: ["jogadores", true, result.timeNovoId] });
        queryClient.invalidateQueries({ queryKey: ["jogadores", false, result.timeNovoId] });
        queryClient.invalidateQueries({ queryKey: ["jogadores-publicos", result.timeNovoId] });
      }
      
      toast({
        title: result.mensagem,
        variant: result.sucesso ? "default" : "destructive",
      });
      
      // Redirecionar após aceitar
      if (variables.aceitar && result.timeNovoId) {
        window.location.href = "/player/dashboard";
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao processar solicitação.",
      });
    },
  });
}

// Hook para enviar convite
export function useEnviarConvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      jogadorUserId,
      jogadorNome,
      jogadorPosicao,
      timeAlvoId,
      mensagem,
    }: {
      jogadorUserId: string;
      jogadorNome: string;
      jogadorPosicao: string;
      timeAlvoId: string;
      mensagem?: string;
    }) => {
      const { data, error } = await supabase
        .from("solicitacoes_ingresso")
        .insert({
          jogador_user_id: jogadorUserId,
          jogador_nome: jogadorNome,
          jogador_posicao: jogadorPosicao,
          time_alvo_id: timeAlvoId,
          mensagem: mensagem || null,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-enviadas"] });
      toast({
        title: "Convite enviado!",
        description: "O jogador receberá uma notificação.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar convite",
        description: error.message || "Tente novamente.",
      });
    },
  });
}
