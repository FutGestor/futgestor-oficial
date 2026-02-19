import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Jogador } from "@/lib/types";

export interface SugestaoEscalacao {
  posicao_campo: string;
  jogador_id: string;
  frequencia: number;
  eficiencia: number;
  gols_por_jogo: number;
}

export interface JogadorEficiencia {
  jogador_id: string;
  posicao_campo: string;
  eficiencia: number;
  gols_por_jogo: number;
  jogos_na_posicao: number;
}

// Hook para obter sugestões de escalação baseadas em padrões
export function useSugestaoEscalacao(teamId: string | undefined, formacao: string) {
  return useQuery({
    queryKey: ["ml-sugestao-escalacao", teamId, formacao],
    enabled: !!teamId && !!formacao,
    queryFn: async () => {
      try {
        // Buscar padrões do admin para essa formação
        const { data: padroes, error } = await supabase
          .from("ml_escalacao_padroes")
          .select("*")
          .eq("team_id", teamId)
          .eq("formacao", formacao)
          .order("frequencia", { ascending: false });

        // Se a tabela não existir ou sem permissão, retornar array vazio silenciosamente
        if (error && (error.code === "42P01" || error.code === "403")) {
          return [] as SugestaoEscalacao[];
        }

        if (error) throw error;

        // Agrupar por posição e pegar o jogador mais frequente
        const sugestoesPorPosicao = new Map<string, typeof padroes[0]>();
        
        padroes?.forEach(padrao => {
          const existente = sugestoesPorPosicao.get(padrao.posicao_campo);
          if (!existente || padrao.frequencia > existente.frequencia) {
            sugestoesPorPosicao.set(padrao.posicao_campo, padrao);
          }
        });

        return Array.from(sugestoesPorPosicao.values()) as SugestaoEscalacao[];
      } catch (err) {
        // Silenciar erro - ML é opcional
        return [] as SugestaoEscalacao[];
      }
    },
  });
}

// Hook para obter eficiência de jogadores por posição
export function useEficienciaJogadores(jogadorIds: string[]) {
  return useQuery({
    queryKey: ["ml-eficiencia-jogadores", jogadorIds],
    enabled: jogadorIds.length > 0,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("ml_jogador_posicoes")
          .select("*")
          .in("jogador_id", jogadorIds);

        // Se a tabela não existir ou sem permissão, retornar array vazio silenciosamente
        if (error) return [] as JogadorEficiencia[];
        
        return data as JogadorEficiencia[];
      } catch (err) {
        return [] as JogadorEficiencia[];
      }
    },
  });
}

// Hook para registrar um padrão de escalação (aprendizado)
export function useRegistrarPadraoEscalacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      formacao,
      jogadoresPorPosicao,
    }: {
      teamId: string;
      formacao: string;
      jogadoresPorPosicao: Record<string, string>;
    }) => {
      try {
        // Para cada posição, upsert o padrão
        const upserts = Object.entries(jogadoresPorPosicao)
          .filter(([, jogadorId]) => jogadorId) // Ignorar posições vazias
          .map(([posicao, jogadorId]) => ({
            team_id: teamId,
            formacao,
            posicao_campo: posicao,
            jogador_id: jogadorId,
            frequencia: 1,
            ultima_escalacao: new Date().toISOString(),
          }));

        if (upserts.length === 0) return;

        // Fazer upsert manual
        const { error: upsertError } = await supabase
          .from("ml_escalacao_padroes")
          .upsert(upserts, {
            onConflict: "team_id,formacao,posicao_campo,jogador_id",
          });

        // Se a tabela não existir ou sem permissão, silenciar
        if (upsertError && (upsertError.code === "42P01" || upsertError.code === "403")) {
          return;
        }

        if (upsertError) throw upsertError;
      } catch (err) {
        // Silenciar erro - ML é opcional
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml-sugestao-escalacao"] });
    },
  });
}

// Função para sugerir escalação baseada em ML + confirmados
export function sugerirEscalacaoInteligente({
  formacao,
  jogadoresDisponiveis,
  padroes,
  confirmados,
}: {
  formacao: string;
  jogadoresDisponiveis: Jogador[];
  padroes: SugestaoEscalacao[];
  confirmados: string[]; // IDs dos jogadores que confirmaram presença
}): Record<string, string> {
  const sugestao: Record<string, string> = {};
  
  // Posições da formação
  const posicoes = formacao.split("-").flatMap((qtd, idx) => {
    const letras = ["GOL", "ZAG", "VOL", "MEI", "ATA"];
    const letra = letras[idx] || "ATA";
    return Array(parseInt(qtd)).fill(0).map((_, i) => 
      idx === 0 ? letra : `${letra}${i + 1}`
    );
  });

  // Prioridade: 1. Padrões do admin, 2. Jogadores confirmados, 3. Eficiência
  const jogadoresUsados = new Set<string>();

  posicoes.forEach(posicao => {
    // Buscar padrão para essa posição
    const padrao = padroes.find(p => 
      p.posicao_campo === posicao || 
      p.posicao_campo.startsWith(posicao.replace(/\d$/, ""))
    );

    if (padrao && !jogadoresUsados.has(padrao.jogador_id)) {
      // Verificar se jogador confirmou presença
      if (confirmados.includes(padrao.jogador_id)) {
        sugestao[posicao] = padrao.jogador_id;
        jogadoresUsados.add(padrao.jogador_id);
        return;
      }
    }

    // Se não há padrão ou jogador não confirmou, buscar entre confirmados
    const jogadorConfirmado = jogadoresDisponiveis.find(j => 
      confirmados.includes(j.id) && 
      !jogadoresUsados.has(j.id) &&
      (j.posicao.toLowerCase().includes(posicao.toLowerCase()) ||
       posicao.toLowerCase().includes(j.posicao.toLowerCase()))
    );

    if (jogadorConfirmado) {
      sugestao[posicao] = jogadorConfirmado.id;
      jogadoresUsados.add(jogadorConfirmado.id);
    }
  });

  return sugestao;
}
