import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * Hook para excluir permanentemente o próprio time
 * Apenas admins podem executar esta ação
 */
export function useDeleteTeam() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.rpc("delete_own_team", {
        _team_id: teamId,
      });

      if (error) {
        throw new Error(error.message || "Erro ao excluir time");
      }
    },
    onSuccess: () => {
      toast({
        title: "Time excluído com sucesso",
        description: "Todos os dados foram removidos permanentemente.",
      });
      
      // Limpar cache
      queryClient.clear();
      
      // Redirecionar para home
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir time",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
