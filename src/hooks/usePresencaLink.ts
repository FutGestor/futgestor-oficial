import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function generateCodigo(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function usePresencaLink(jogoId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: link, isLoading } = useQuery({
    queryKey: ["presenca-link", jogoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presenca_links" as any)
        .select("*")
        .eq("jogo_id", jogoId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; jogo_id: string; team_id: string; codigo: string; created_at: string } | null;
    },
  });

  const createLink = async () => {
    if (link || !profile?.team_id) return link;
    setIsCreating(true);
    try {
      const codigo = generateCodigo();
      const { data, error } = await supabase
        .from("presenca_links" as any)
        .insert({ jogo_id: jogoId, team_id: profile.team_id, codigo } as any)
        .select()
        .single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["presenca-link", jogoId] });
      return data as unknown as { id: string; codigo: string };
    } finally {
      setIsCreating(false);
    }
  };

  return { link, isLoading, isCreating, createLink };
}

export function usePresencasViaLink(presencaLinkId: string | undefined) {
  return useQuery({
    queryKey: ["presencas-via-link", presencaLinkId],
    enabled: !!presencaLinkId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presencas" as any)
        .select("*")
        .eq("presenca_link_id", presencaLinkId!);
      if (error) throw error;
      return data as unknown as Array<{ id: string; presenca_link_id: string; jogador_id: string; status: string; updated_at: string }>;
    },
  });
}
