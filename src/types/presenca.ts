// ============================================
// TIPOS ESTRITOS PARA SISTEMA DE PRESENÇA
// ============================================

/** Link de presença gerado para um jogo */
export interface PresencaLink {
  id: string;
  jogo_id: string;
  team_id: string;
  codigo: string;
  created_at: string;
  expires_at?: string | null;
  ativo: boolean;
}

/** Registro de presença de um jogador */
export interface Presenca {
  id: string;
  presenca_link_id: string;
  jogador_id: string;
  status: 'confirmado' | 'pendente' | 'recusado' | string;
  updated_at: string;
  created_at: string;
  observacao?: string | null;
}

/** Dados para criar um novo link de presença */
export interface CreatePresencaLinkDTO {
  jogo_id: string;
  team_id: string;
  codigo: string;
  expires_at?: string | null;
}

/** Dados para registrar uma presença */
export interface CreatePresencaDTO {
  presenca_link_id: string;
  jogador_id: string;
  status: 'confirmado' | 'pendente' | 'recusado';
  observacao?: string | null;
}

/** Estatísticas de presença de um jogo */
export interface PresencaStats {
  total: number;
  confirmados: number;
  pendentes: number;
  recusados: number;
}

/** Jogador público (dados limitados) */
export interface JogadorPublico {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: string;
  numero: number | null;
  foto_url: string | null;
}
