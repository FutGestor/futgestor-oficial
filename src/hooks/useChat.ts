import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMensagem {
  id: string;
  team_id: string;
  user_id: string;
  jogador_id: string | null;
  conteudo: string;
  tipo: "texto" | "imagem" | "sistema";
  created_at: string;
  jogador?: {
    id: string;
    nome: string;
    apelido: string | null;
    foto_url: string | null;
  } | null;
}

const QUERY_KEY = "chat-mensagens";
const PAGE_SIZE = 100;

export function useChatMessages(teamId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("chat_mensagens")
        .select("*, jogador:jogadores(id, nome, apelido, foto_url)")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return (data || []) as ChatMensagem[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 8,
    refetchOnWindowFocus: true,
  });
}

export function useOlderMessages(teamId: string | undefined) {
  const queryClient = useQueryClient();

  const loadOlder = useCallback(async () => {
    if (!teamId) return false;
    const currentMessages = queryClient.getQueryData<ChatMensagem[]>([QUERY_KEY, teamId]);
    if (!currentMessages || currentMessages.length === 0) return false;

    const oldestDate = currentMessages[0].created_at;
    const { data, error } = await supabase
      .from("chat_mensagens")
      .select("*, jogador:jogadores(id, nome, apelido, foto_url)")
      .eq("team_id", teamId)
      .lt("created_at", oldestDate)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) throw error;
    if (!data || data.length === 0) return false;

    queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) => {
      if (!old) return data.reverse() as ChatMensagem[];
      return [...(data.reverse() as ChatMensagem[]), ...old];
    });
    return data.length === PAGE_SIZE; // has more
  }, [teamId, queryClient]);

  return { loadOlder };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ teamId, conteudo }: { teamId: string; conteudo: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const newMsg = {
        team_id: teamId,
        user_id: userId,
        jogador_id: profile?.jogador_id || null,
        conteudo: conteudo.trim(),
        tipo: "texto",
      };

      const { data, error } = await supabase.from("chat_mensagens").insert(newMsg).select("*, jogador:jogadores(id, nome, apelido, foto_url)").single();
      if (error) throw error;
      return data as ChatMensagem;
    },
    onMutate: async ({ teamId, conteudo }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, teamId] });
      const previous = queryClient.getQueryData<ChatMensagem[]>([QUERY_KEY, teamId]);
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const optimistic: ChatMensagem = {
        id: `temp-${Date.now()}`,
        team_id: teamId,
        user_id: userId || "",
        jogador_id: profile?.jogador_id || null,
        conteudo: conteudo.trim(),
        tipo: "texto",
        created_at: new Date().toISOString(),
        jogador: profile?.jogador_id ? {
          id: profile.jogador_id,
          nome: profile.nome || "",
          apelido: null,
          foto_url: null,
        } : null,
      };

      queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) => [...(old || []), optimistic]);
      return { previous };
    },
    onError: (_err, { teamId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, teamId], context.previous);
      }
    },
    onSuccess: (data, { teamId }) => {
      queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) => {
        if (!old) return [data];
        // Replace optimistic message with real one
        const filtered = old.filter(m => !m.id.startsWith("temp-") || m.conteudo !== data.conteudo);
        // Avoid duplication if realtime already added it
        if (filtered.some(m => m.id === data.id)) return filtered;
        return [...filtered, data];
      });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string; teamId: string }) => {
      const { error } = await supabase.from("chat_mensagens").delete().eq("id", messageId) as { error: Error | null };
      if (error) throw error;
    },
    onMutate: async ({ messageId, teamId }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, teamId] });
      const previous = queryClient.getQueryData<ChatMensagem[]>([QUERY_KEY, teamId]);
      queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) =>
        old?.filter(m => m.id !== messageId) || []
      );
      return { previous };
    },
    onError: (_err, { teamId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, teamId], context.previous);
      }
    },
  });
}

export function useChatRealtime(teamId: string | undefined): number {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!teamId) {
      setOnlineCount(0);
      return;
    }

    const channel = supabase
      .channel(`chat-${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_mensagens", filter: `team_id=eq.${teamId}` },
        async (payload) => {
           // ... existing INSERT logic ...
          const newMsg = payload.new as ChatMensagem;
          if (newMsg.jogador_id) {
            const { data: jogador } = await supabase
              .from("jogadores")
              .select("id, nome, apelido, foto_url")
              .eq("id", newMsg.jogador_id)
              .single();
            newMsg.jogador = jogador;
          }
          queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) => {
            if (!old) return [newMsg];
            if (old.some(m => m.id === newMsg.id)) return old;
            const filtered = old.filter(m =>
              !(m.id.startsWith("temp-") && m.user_id === newMsg.user_id && m.conteudo === newMsg.conteudo)
            );
            return [...filtered, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_mensagens", filter: `team_id=eq.${teamId}` },
        (payload) => {
           // ... existing DELETE logic ...
          const deletedId = (payload.old as { id: string }).id;
          queryClient.setQueryData<ChatMensagem[]>([QUERY_KEY, teamId], (old) =>
            old?.filter(m => m.id !== deletedId) || []
          );
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        console.log("Presence sync event:", state);
        // Count unique users
        const userIds = new Set<string>();
        for (const key in state) {
          // @ts-ignore
          state[key].forEach((presence: any) => {
            if (presence.user_id) userIds.add(presence.user_id);
          });
        }
        setOnlineCount(userIds.size);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (user?.id) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          } else {
            console.error("User ID missing, cannot track presence.");
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient, user?.id]);

  return onlineCount;
}

export function useTeamMemberCount(teamId: string | undefined) {
  return useQuery({
    queryKey: ["team-member-count", teamId],
    queryFn: async () => {
      if (!teamId) return 0;
      const { count, error } = await supabase
        .from("jogadores")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("ativo", true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}
