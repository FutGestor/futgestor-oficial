import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PresencaLink, Presenca, CreatePresencaLinkDTO } from "@/types/presenca";

function generateCodigo(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Hook para gerenciar link de presença de um jogo */
export function usePresencaLink(jogoId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: link, isLoading } = useQuery<PresencaLink | null>({
    queryKey: ["presenca-link", jogoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presenca_links")
        .select("*")
        .eq("jogo_id", jogoId)
        .maybeSingle();
      if (error) throw error;
      return data as PresencaLink | null;
    },
  });

  const createLink = async (): Promise<PresencaLink | null> => {
    if (link || !profile?.team_id) return link;
    setIsCreating(true);
    try {
      const codigo = generateCodigo();
      const insertData: CreatePresencaLinkDTO = {
        jogo_id: jogoId,
        team_id: profile.team_id,
        codigo,
      };
      
      const { data, error } = await supabase
        .from("presenca_links")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["presenca-link", jogoId] });
      return data as PresencaLink;
    } finally {
      setIsCreating(false);
    }
  };

  return { link, isLoading, isCreating, createLink };
}

/** Hook para buscar presenças registradas via link */
export function usePresencasViaLink(presencaLinkId: string | undefined) {
  return useQuery<Presenca[]>({
    queryKey: ["presencas-via-link", presencaLinkId],
    enabled: !!presencaLinkId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presencas")
        .select("*")
        .eq("presenca_link_id", presencaLinkId!);
      if (error) throw error;
      return (data || []) as Presenca[];
    },
  });
}

/** Hook para buscar estatísticas de presença de um jogo */
export function usePresencaStats(jogoId: string | undefined) {
  return useQuery<{ confirmados: number; pendentes: number; recusados: number; total: number }>({
    queryKey: ["presenca-stats", jogoId],
    enabled: !!jogoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_presenca_stats", { _jogo_id: jogoId });
      if (error) throw error;
      return data as { confirmados: number; pendentes: number; recusados: number; total: number };
    },
  });
}
