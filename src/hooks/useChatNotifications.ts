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

      // 1. Get last read timestamp
      const { data: readData } = await supabase
        // @ts-ignore
        .from("chat_leituras")
        .select("last_read_at")
        .eq("user_id", user.id)
        .eq("team_id", teamId)
        .maybeSingle() as { data: { last_read_at: string } | null };

      const lastReadAt = readData?.last_read_at || "1970-01-01T00:00:00Z";

      // 2. Count messages after that timestamp
      const { count, error } = await supabase
        // @ts-ignore
        .from("chat_mensagens")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .gt("created_at", lastReadAt);

      if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }

      return count || 0;
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
          filter: `team_id=eq.${teamId}` // Restoring specific filter
        },
        (payload) => {
          // Client-side Double Check + Optimistic Update
          if (payload.new && payload.new.team_id === teamId) {
             // OPTIMISTIC UPDATE: Increment count immediately if message is not from current user
             if (payload.new.user_id !== user?.id) {
               queryClient.setQueryData([QUERY_KEY, teamId], (old: number | undefined) => (old || 0) + 1);
             }
             
             // Then invalidate to be sure
             queryClient.invalidateQueries({ queryKey: [QUERY_KEY, teamId] });
          }
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "chat_leituras",
          filter: `team_id=eq.${teamId}`
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
      
      // Use RPC to ensure server timestamp is used
      const { error } = await supabase.rpc('mark_chat_read', { p_team_id: teamId });

      if (error) {
        console.error("Error marking chat read:", error);
        // Fallback to client timestamp if RPC fails (e.g. not created yet)
        const { error: upsertError } = await supabase
          // @ts-ignore
          .from("chat_leituras")
          .upsert({ 
            user_id: user.id, 
            team_id: teamId, 
            last_read_at: new Date().toISOString() 
          });
        
        if (upsertError) throw upsertError;
      }
    },
    onSuccess: (_, teamId) => {
      queryClient.setQueryData([QUERY_KEY, teamId], 0);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, teamId] });
    },
  });
}
