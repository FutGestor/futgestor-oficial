// ============================================
// TIPOS ESTRITOS PARA SISTEMA DE CONQUISTAS
// ============================================

import type { AchievementTier } from "@/components/achievements/AchievementBadge";

/** Nível/Tier de uma conquista */
export interface Tier {
  level: AchievementTier;
  label: string;
  threshold: number;
}

/** Definição de uma conquista no sistema */
export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'universal' | 'position' | 'special' | string;
  applicable_positions: string[];
  tiers: Tier[];
  created_at?: string;
}

/** Progresso de um jogador em uma conquista */
export interface PlayerAchievement {
  achievement_id: string;
  current_tier: AchievementTier | null;
  current_value: number;
  unlocked_at: string | null;
  achievement: Achievement;
}

/** Registro do banco de dados para player_achievements */
export interface PlayerAchievementDB {
  id?: string;
  jogador_id: string;
  achievement_id: string;
  current_tier: AchievementTier | null;
  current_value: number;
  unlocked_at: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Estatísticas de performance do jogador (usado em Conquistas) */
export interface PlayerStat {
  gols: number;
  assistencias: number;
  participou: boolean;
  cartao_amarelo: boolean;
  cartao_vermelho: boolean;
  resultado?: {
    mvp_jogador_id: string | null;
    jogo: {
      data_hora: string;
    };
  };
}

/** Dados de performance retornados pelo hook */
export interface PlayerPerformanceData {
  playerStats: PlayerStat[];
  teamStats: Array<{
    gols: number;
    assistencias: number;
    participou: boolean;
    jogador_id: string;
  }>;
}

/** Jogador simplificado para seleção */
export interface JogadorOption {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: string;
  foto_url: string | null;
  data_entrada: string | null;
}

/** Perfil do usuário com jogador vinculado */
export interface ProfileWithJogador {
  id: string;
  nome: string;
  foto_url: string | null;
  jogador_id: string | null;
  created_at: string;
}
