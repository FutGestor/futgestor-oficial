import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Chamado {
  id: string;
  assunto: string;
  descricao: string;
  categoria: string;
  status: string;
  user_id: string;
  team_id: string;
  criado_em: string;
  atualizado_em: string;
  team?: { nome: string } | null;
}

export interface ChamadoMensagem {
  id: string;
  chamado_id: string;
  user_id: string;
  mensagem: string;
  is_admin: boolean;
  criado_em: string;
}

export interface ChamadoAnexo {
  id: string;
  chamado_id: string;
  mensagem_id: string | null;
  url: string;
  nome_arquivo: string;
  criado_em: string;
}

// Hooks para o usuário comum
export function useMeusChamados() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["meus-chamados", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Chamado[];
    },
  });
}

export function useCriarChamado() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { assunto: string; descricao: string; categoria: string }) => {
      if (!user || !profile?.team_id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("chamados")
        .insert({
          assunto: input.assunto,
          descricao: input.descricao,
          categoria: input.categoria,
          user_id: user.id,
          team_id: profile.team_id,
        })
        .select()
        .single();
      if (error) throw error;

      // Create first message with description
      await supabase.from("chamado_mensagens").insert({
        chamado_id: data.id,
        user_id: user.id,
        mensagem: input.descricao,
        is_admin: false,
      });

      return data as Chamado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-chamados"] });
      queryClient.invalidateQueries({ queryKey: ["todos-chamados"] });
    },
  });
}

export function useChamadoMensagens(chamadoId: string | undefined) {
  return useQuery({
    queryKey: ["chamado-mensagens", chamadoId],
    enabled: !!chamadoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamado_mensagens")
        .select("*")
        .eq("chamado_id", chamadoId!)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data as ChamadoMensagem[];
    },
  });
}

export function useChamadoAnexos(chamadoId: string | undefined) {
  return useQuery({
    queryKey: ["chamado-anexos", chamadoId],
    enabled: !!chamadoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamado_anexos")
        .select("*")
        .eq("chamado_id", chamadoId!);
      if (error) throw error;
      return data as ChamadoAnexo[];
    },
  });
}

export function useEnviarMensagem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      chamadoId: string;
      mensagem: string;
      isAdmin?: boolean;
      anexos?: File[];
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: msg, error } = await supabase
        .from("chamado_mensagens")
        .insert({
          chamado_id: input.chamadoId,
          user_id: user.id,
          mensagem: input.mensagem,
          is_admin: input.isAdmin ?? false,
        })
        .select()
        .single();
      if (error) throw error;

      // Upload anexos
      if (input.anexos?.length) {
        for (const file of input.anexos) {
          const filePath = `${user.id}/${input.chamadoId}/${Date.now()}_${file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("chamados-anexos")
            .upload(filePath, file);
          if (uploadErr) continue;

          const { data: urlData } = supabase.storage
            .from("chamados-anexos")
            .getPublicUrl(filePath);

          await supabase.from("chamado_anexos").insert({
            chamado_id: input.chamadoId,
            mensagem_id: msg.id,
            url: urlData.publicUrl,
            nome_arquivo: file.name,
          });
        }
      }

      return msg;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chamado-mensagens", vars.chamadoId] });
      queryClient.invalidateQueries({ queryKey: ["chamado-anexos", vars.chamadoId] });
    },
  });
}

// Hooks para super admin
export function useTodosChamados() {
  const { isSuperAdmin } = useAuth();

  return useQuery({
    queryKey: ["todos-chamados"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados")
        .select("*, team:teams(nome)")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Chamado[];
    },
  });
}

export function useAtualizarStatusChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { chamadoId: string; status: string }) => {
      const { error } = await supabase
        .from("chamados")
        .update({ status: input.status })
        .eq("id", input.chamadoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos-chamados"] });
      queryClient.invalidateQueries({ queryKey: ["meus-chamados"] });
    },
  });
}
