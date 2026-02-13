import { useMemo } from 'react';
import { Jogador } from "@/lib/types";
import { useJogadores } from "@/hooks/useData";
import { useRanking } from "@/hooks/useEstatisticas";

// Helper para calcular atributos base (mesma lógica do StickerCard)
const getBaseStats = (pos: string) => {
  switch (pos?.toLowerCase()) {
    case 'atacante': return { pac: 90, sho: 90, pas: 80, dri: 95, def: 40, phy: 75 };
    case 'lateral': return { pac: 80, sho: 70, pas: 85, dri: 80, def: 75, phy: 70 };
    case 'meia': return { pac: 85, sho: 95, pas: 95, dri: 95, def: 50, phy: 65 };
    case 'volante': return { pac: 78, sho: 75, pas: 88, dri: 90, def: 80, phy: 85 };
    case 'zagueiro': return { pac: 75, sho: 70, pas: 78, dri: 80, def: 90, phy: 88 };
    case 'goleiro': return { pac: 70, sho: 65, pas: 75, dri: 80, def: 95, phy: 80 }; // Goleiro use bases diferentes no card, mas aqui simplificamos para calculo de força
    default: return { pac: 70, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  }
};

export interface PlayerRating {
  jogador: Jogador;
  overall: number;
  stats: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
}

export function useTacticalAssistant(teamId?: string) {
  const { data: jogadores, isLoading: loadPlayers } = useJogadores(true, teamId);
  const { data: statsReais, isLoading: loadStats } = useRanking(teamId);

  // Calcular ratings de todos os jogadores
  const ratedPlayers = useMemo(() => {
    if (!jogadores) return [];

    return jogadores.map(player => {
      const base = getBaseStats(player.posicao);
      
      // Fator determinístico para variação base (ID based)
      const dnaBonus = (player.id.charCodeAt(0) % 5); 

      // Dados Reais (Machine Learning Lite)
      const playerStats = statsReais && statsReais.participacao 
        ? statsReais.participacao.find(s => s.jogador.id === player.id)
        : null;
      
      const gols = playerStats?.gols || 0;
      const assistencias = playerStats?.assistencias || 0;
      const jogos = playerStats?.jogos || 0;

      // Evolução de Atributos com base em performance
      const finishingBonus = Math.min(15, gols * 1.5); // Max +15 de chute por gols
      const passingBonus = Math.min(15, assistencias * 2); // Max +15 de passe por assists
      const experienceBonus = Math.min(10, jogos * 0.5); // Max +10 de fisico/mental por jogos
      const defenseBonus = Math.min(10, (jogos * 0.3) + (player.posicao === 'zagueiro' ? jogos * 0.5 : 0));

      const stats = {
        pac: Math.min(99, base.pac + dnaBonus + (experienceBonus * 0.2)),
        sho: Math.min(99, base.sho + dnaBonus + finishingBonus),
        pas: Math.min(99, base.pas + dnaBonus + passingBonus),
        dri: Math.min(99, base.dri + dnaBonus + (assistencias * 0.5)),
        def: Math.min(99, base.def + dnaBonus + defenseBonus),
        phy: Math.min(99, base.phy + dnaBonus + experienceBonus),
      };

      const overall = Math.round(
        (stats.pac + stats.sho + stats.pas + stats.dri + stats.def + stats.phy) / 6
      );

      return {
        jogador: player,
        overall,
        stats
      } as PlayerRating;
    }).sort((a, b) => b.overall - a.overall);
  }, [jogadores, statsReais]);

  const suggestLineup = (formation: string, slots: string[]) => {
    const usedPlayerIds = new Set<string>();
    const starters: { jogador: Jogador; posicao_campo: string }[] = [];

    // Priorizar Goleiro para ser processado primeiro
    const sortedSlots = [...slots].sort((a, b) => {
      if (a.includes('goleiro')) return -1;
      if (b.includes('goleiro')) return 1;
      return 0;
    });

    // Passo 1: Preencher todos os slots titulares obrigatoriamente
    sortedSlots.forEach(slot => {
      // 1. Tenta o melhor especialista disponível para o slot
      let bestChoice = ratedPlayers
        .filter(p => !usedPlayerIds.has(p.jogador.id))
        .find(p => matchPosition(p.jogador.posicao, slot, true)); // Modo estrito

      // 2. Se não achou especialista, tenta qualquer jogador compatível (flexível)
      if (!bestChoice) {
        bestChoice = ratedPlayers
          .filter(p => !usedPlayerIds.has(p.jogador.id))
          .find(p => matchPosition(p.jogador.posicao, slot, false)); // Modo flexível
      }

      // 3. Fallback Total: Pega o melhor jogador que sobrou, independente da posição
      if (!bestChoice) {
        bestChoice = ratedPlayers
          .filter(p => !usedPlayerIds.has(p.jogador.id))
          .sort((a, b) => b.overall - a.overall) // Garantir que pegamos o melhor do que restou
          .find(() => true);
      }

      if (bestChoice) {
        usedPlayerIds.add(bestChoice.jogador.id);
        starters.push({
          jogador: bestChoice.jogador,
          posicao_campo: slot
        });
      }
    });

    // Passo 2: Todos os jogadores que sobraram vão para o banco (até o limite de 7 ou mais se desejar)
    const bench = ratedPlayers
      .filter(p => !usedPlayerIds.has(p.jogador.id))
      .map(p => ({
        jogador: p.jogador,
        posicao_campo: 'banco'
      }));

    return [...starters, ...bench];
  };

  const matchPosition = (playerPos: string, slotName: string, strict: boolean = false) => {
    // Mapeamento de compatibilidade perfeita (Especialistas)
    if (slotName.includes('goleiro') && playerPos === 'goleiro') return true;
    if (slotName.includes('zagueiro') && playerPos === 'zagueiro') return true;
    if (slotName.includes('lateral') && playerPos === 'lateral') return true;
    if (slotName.includes('volante') && playerPos === 'volante') return true;
    if (slotName.includes('meia') && playerPos === 'meia') return true;
    if (slotName.includes('atacante') && playerPos === 'atacante') return true;
    if (slotName.includes('ponta') && playerPos === 'atacante') return true;
    
    // Se estiver em modo estrito, não permite improvisos
    if (strict) return false;

    // Flexibilidade (Improvisos)
    if (slotName.includes('zagueiro') && playerPos === 'lateral') return true;
    if (slotName.includes('lateral') && playerPos === 'zagueiro') return true;
    if (slotName.includes('meia') && playerPos === 'volante') return true;
    if (slotName.includes('volante') && playerPos === 'meia') return true;
    if (slotName.includes('atacante') && playerPos === 'meia') return true;

    return false;
  };

  return {
    ratedPlayers,
    suggestLineup,
    isLoading: loadPlayers || loadStats
  };
}
