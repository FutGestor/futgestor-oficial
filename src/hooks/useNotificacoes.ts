import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notificacao {
  id: string;
  user_id: string;
  team_id: string | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  jogo_agendado: "⚽",
  convocacao: "📋",
  resultado: "📊",
  conquista: "🏆",
  destaque: "⭐",
  novo_jogador: "👥",
  aviso: "📢",
  escalacao: "📋",
  financeiro: "💰",
  jogador_aprovado: "🎉",
  solicitacao_jogo: "📅",
};

export function getNotificationIcon(tipo: string): string {
  return NOTIFICATION_ICONS[tipo] || "🔔";
}

// Helper: typed access to the 'notificacoes' table that may not be in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notificacoesTable = () => (supabase as any).from("notificacoes");

export function useNotificacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notificacoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await notificacoesTable()
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.warn("Notificações: tabela ainda não disponível", error.message);
          return [] as Notificacao[];
        }
        return (data as Notificacao[]) ?? [];
      } catch {
        return [] as Notificacao[];
      }
    },
  });
}

export function useNotificacoesNaoLidas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notificacoes-nao-lidas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { count, error } = await notificacoesTable()
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("lida", false);

        if (error) {
          console.warn("Notificações: contagem não disponível", error.message);
          return 0;
        }
        return (count as number) ?? 0;
      } catch {
        return 0;
      }
    },
  });
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await notificacoesTable()
        .update({ lida: true })
        .eq("id", notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
    },
  });
}

export function useMarcarTodasLidas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await notificacoesTable()
        .update({ lida: true })
        .eq("user_id", user!.id)
        .eq("lida", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
    },
  });
}

// Realtime subscription — activated inside NotificationBell
export function useNotificacoesRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notificacoes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
          queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
