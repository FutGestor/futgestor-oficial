import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const QUERY_KEY = "chat-unread";

export function useUnreadChatCount(teamId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: [QUERY_KEY, teamId],
    queryFn: async () => {
      if (!teamId || !user) return 0;

      // Count unread messages by checking chat_leituras
      // Messages are unread if they don't have an entry in chat_leituras
      const { data: messages, error: msgError } = await supabase
        // @ts-ignore
        .from("chat_mensagens")
        .select("id")
        .eq("team_id", teamId)
        .neq("user_id", user.id);

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        return 0;
      }

      if (!messages || messages.length === 0) return 0;

      const messageIds = messages.map((m: { id: string }) => m.id);

      // Check which messages have been read
      const { data: readMessages, error: readError } = await supabase
        // @ts-ignore
        .from("chat_leituras")
        .select("mensagem_id")
        .eq("user_id", user.id)
        .in("mensagem_id", messageIds);

      if (readError) {
        console.error("Error fetching read messages:", readError);
        return 0;
      }

      const readIds = new Set(readMessages?.map((r: { mensagem_id: string }) => r.mensagem_id) || []);
      const unreadCount = messageIds.filter((id: string) => !readIds.has(id)).length;

      return unreadCount;
    },
    enabled: !!teamId && !!user,
    refetchInterval: 5000, 
    refetchOnWindowFocus: true,
  });

  // Realtime subscription
  // @ts-ignore
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`chat-notifications-${teamId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "chat_mensagens",
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          if (payload.new && payload.new.team_id === teamId) {
             if (payload.new.user_id !== user?.id) {
               queryClient.setQueryData([QUERY_KEY, teamId], (old: number | undefined) => (old || 0) + 1);
             }
             queryClient.invalidateQueries({ queryKey: [QUERY_KEY, teamId] });
          }
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "chat_leituras"
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY, teamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient, user?.id]);

  return query;
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) return;
      
      // Get all message IDs for this team
      const { data: messages, error: msgError } = await supabase
        // @ts-ignore
        .from("chat_mensagens")
        .select("id")
        .eq("team_id", teamId)
        .neq("user_id", user.id);

      if (msgError) {
        console.error("Error fetching messages to mark read:", msgError);
        return;
      }

      if (!messages || messages.length === 0) return;

      // Insert read entries for all messages
      const readEntries = messages.map((m: { id: string }) => ({
        user_id: user.id,
        mensagem_id: m.id,
        lida_em: new Date().toISOString()
      }));

      const { error } = await supabase
        // @ts-ignore
        .from("chat_leituras")
        .upsert(readEntries, { onConflict: 'user_id,mensagem_id' });

      if (error) {
        console.error("Error marking chat read:", error);
        throw error;
      }
    },
    onSuccess: (_, teamId) => {
      queryClient.setQueryData([QUERY_KEY, teamId], 0);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, teamId] });
    },
  });
}
