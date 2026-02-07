// Types para o portal de gestão de time

export type PlayerPosition = 'goleiro' | 'zagueiro' | 'lateral' | 'volante' | 'meia' | 'atacante';

export type GameStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'finalizado' | 'cancelado';

export type TransactionType = 'entrada' | 'saida';

export type NoticeCategory = 'geral' | 'urgente' | 'financeiro' | 'jogo';

export interface Jogador {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: PlayerPosition;
  numero: number | null;
  foto_url: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  user_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

// Public-safe version (no email/telefone)
export interface JogadorPublico {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: PlayerPosition;
  numero: number | null;
  foto_url: string | null;
  ativo: boolean;
  team_id: string | null;
}

export type PresenceStatus = 'confirmado' | 'indisponivel' | 'pendente';

export interface Time {
  id: string;
  nome: string;
  apelido: string | null;
  escudo_url: string | null;
  cores_principais: string | null;
  cidade: string | null;
  is_casa: boolean;
  ativo: boolean;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Jogo {
  id: string;
  data_hora: string;
  local: string;
  adversario: string;
  status: GameStatus;
  observacoes: string | null;
  temporada: string | null;
  time_adversario_id: string | null;
  time_adversario?: Time | null;
  created_at: string;
  updated_at: string;
}

export interface EstatisticaPartida {
  id: string;
  resultado_id: string;
  jogador_id: string;
  gols: number;
  assistencias: number;
  cartao_amarelo: boolean;
  cartao_vermelho: boolean;
  participou: boolean;
  created_at: string;
  jogador?: Jogador;
}

export interface ConfirmacaoPresenca {
  id: string;
  jogo_id: string;
  jogador_id: string;
  status: PresenceStatus;
  created_at: string;
  updated_at: string;
  jogador?: Jogador;
}

export interface EstatisticasJogador {
  jogador_id: string;
  jogos: number;
  gols: number;
  assistencias: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
}

export interface Resultado {
  id: string;
  jogo_id: string;
  gols_favor: number;
  gols_contra: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  jogo?: Jogo;
}

export interface Transacao {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: TransactionType;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface Escalacao {
  id: string;
  jogo_id: string;
  formacao: string;
  publicada: boolean;
  created_at: string;
  updated_at: string;
  jogo?: Jogo;
}

export interface EscalacaoJogador {
  id: string;
  escalacao_id: string;
  jogador_id: string;
  posicao_campo: string;
  ordem: number;
  created_at: string;
  jogador?: Jogador;
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: NoticeCategory;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

// Helper types
export interface FinancialSummary {
  saldoAtual: number;
  totalArrecadado: number;
  totalGasto: number;
}

export interface GameResult extends Jogo {
  resultado?: Resultado;
}

export const positionLabels: Record<PlayerPosition, string> = {
  goleiro: 'Goleiro',
  zagueiro: 'Zagueiro',
  lateral: 'Lateral',
  volante: 'Volante',
  meia: 'Meia',
  atacante: 'Atacante',
};

export const statusLabels: Record<GameStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em Andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export const categoryLabels: Record<NoticeCategory, string> = {
  geral: 'Geral',
  urgente: 'Urgente',
  financeiro: 'Financeiro',
  jogo: 'Jogo',
};

export const presenceStatusLabels: Record<PresenceStatus, string> = {
  confirmado: 'Confirmado',
  indisponivel: 'Indisponível',
  pendente: 'Pendente',
};

// Society/Campo modality types
export type GameModality = 'society-5' | 'society-6' | 'society-7' | 'campo-11';

export const modalityLabels: Record<GameModality, string> = {
  'society-5': 'Society 5x5 (6 jogadores)',
  'society-6': 'Society 6x6 (7 jogadores)',
  'society-7': 'Society 7x7 (8 jogadores)',
  'campo-11': 'Campo 11x11 (11 jogadores)',
};

export const formacoesPorModalidade: Record<GameModality, string[]> = {
  'society-5': ['2-2-1', '1-2-2', '2-1-2', '1-3-1'],
  'society-6': ['2-2-2', '2-3-1', '3-2-1', '2-1-3'],
  'society-7': ['2-3-2', '3-2-2', '2-2-3', '3-3-1'],
  'campo-11': ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'],
};

// Mapeamento de posições por FORMAÇÃO (dinâmico)
export const formationPositions: Record<string, Record<string, { top: string; left: string }>> = {
  // Society 5x5 (5 jogadores de linha + goleiro = 6)
  '2-2-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  '1-2-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '2-1-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-centro': { top: '42%', left: '50%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '1-3-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'meia-esquerdo': { top: '42%', left: '25%' },
    'meia-centro': { top: '42%', left: '50%' },
    'meia-direito': { top: '42%', left: '75%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  // Society 6x6 (6 jogadores de linha + goleiro = 7)
  '2-2-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '2-3-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-esquerdo': { top: '42%', left: '25%' },
    'meia-centro': { top: '42%', left: '50%' },
    'meia-direito': { top: '42%', left: '75%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  '3-2-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '25%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'zagueiro-direito': { top: '68%', left: '75%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  '2-1-3': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-centro': { top: '42%', left: '50%' },
    'atacante-esquerdo': { top: '15%', left: '25%' },
    'atacante-centro': { top: '15%', left: '50%' },
    'atacante-direito': { top: '15%', left: '75%' },
  },
  // Society 7x7 (7 jogadores de linha + goleiro = 8)
  '2-3-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-esquerdo': { top: '42%', left: '25%' },
    'meia-centro': { top: '42%', left: '50%' },
    'meia-direito': { top: '42%', left: '75%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '3-2-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '25%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'zagueiro-direito': { top: '68%', left: '75%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '2-2-3': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'meia-esquerdo': { top: '42%', left: '35%' },
    'meia-direito': { top: '42%', left: '65%' },
    'atacante-esquerdo': { top: '15%', left: '25%' },
    'atacante-centro': { top: '15%', left: '50%' },
    'atacante-direito': { top: '15%', left: '75%' },
  },
  '3-3-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '25%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'zagueiro-direito': { top: '68%', left: '75%' },
    'meia-esquerdo': { top: '42%', left: '25%' },
    'meia-centro': { top: '42%', left: '50%' },
    'meia-direito': { top: '42%', left: '75%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  // Campo 11x11
  '4-3-3': {
    'goleiro': { top: '90%', left: '50%' },
    'zagueiro-esquerdo': { top: '75%', left: '30%' },
    'zagueiro-centro-esquerdo': { top: '75%', left: '43%' },
    'zagueiro-centro-direito': { top: '75%', left: '57%' },
    'zagueiro-direito': { top: '75%', left: '70%' },
    'meia-esquerdo': { top: '50%', left: '25%' },
    'meia-centro': { top: '50%', left: '50%' },
    'meia-direito': { top: '50%', left: '75%' },
    'atacante-esquerdo': { top: '18%', left: '25%' },
    'atacante-centro': { top: '12%', left: '50%' },
    'atacante-direito': { top: '18%', left: '75%' },
  },
  '4-4-2': {
    'goleiro': { top: '90%', left: '50%' },
    'zagueiro-esquerdo': { top: '75%', left: '30%' },
    'zagueiro-centro-esquerdo': { top: '75%', left: '43%' },
    'zagueiro-centro-direito': { top: '75%', left: '57%' },
    'zagueiro-direito': { top: '75%', left: '70%' },
    'meia-esquerdo': { top: '50%', left: '20%' },
    'meia-centro-esquerdo': { top: '50%', left: '40%' },
    'meia-centro-direito': { top: '50%', left: '60%' },
    'meia-direito': { top: '50%', left: '80%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '3-5-2': {
    'goleiro': { top: '90%', left: '50%' },
    'zagueiro-esquerdo': { top: '75%', left: '30%' },
    'zagueiro-centro': { top: '75%', left: '50%' },
    'zagueiro-direito': { top: '75%', left: '70%' },
    'meia-esquerdo': { top: '50%', left: '15%' },
    'meia-centro-esquerdo': { top: '50%', left: '35%' },
    'meia-centro': { top: '50%', left: '50%' },
    'meia-centro-direito': { top: '50%', left: '65%' },
    'meia-direito': { top: '50%', left: '85%' },
    'atacante-esquerdo': { top: '15%', left: '35%' },
    'atacante-direito': { top: '15%', left: '65%' },
  },
  '4-2-3-1': {
    'goleiro': { top: '90%', left: '50%' },
    'zagueiro-esquerdo': { top: '75%', left: '30%' },
    'zagueiro-centro-esquerdo': { top: '75%', left: '43%' },
    'zagueiro-centro-direito': { top: '75%', left: '57%' },
    'zagueiro-direito': { top: '75%', left: '70%' },
    'volante-esquerdo': { top: '58%', left: '40%' },
    'volante-direito': { top: '58%', left: '60%' },
    'meia-esquerdo': { top: '35%', left: '25%' },
    'meia-centro': { top: '35%', left: '50%' },
    'meia-direito': { top: '35%', left: '75%' },
    'atacante-centro': { top: '12%', left: '50%' },
  },
};

// Slots disponíveis por formação
export const positionSlotsByFormation: Record<string, string[]> = {
  // Society 5x5
  '2-2-1': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-esquerdo', 'meia-direito', 'atacante-centro'],
  '1-2-2': ['goleiro', 'zagueiro-centro', 'meia-esquerdo', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '2-1-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-centro', 'atacante-esquerdo', 'atacante-direito'],
  '1-3-1': ['goleiro', 'zagueiro-centro', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-centro'],
  // Society 6x6
  '2-2-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-esquerdo', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '2-3-1': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-centro'],
  '3-2-1': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro', 'zagueiro-direito', 'meia-esquerdo', 'meia-direito', 'atacante-centro'],
  '2-1-3': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-centro', 'atacante-esquerdo', 'atacante-centro', 'atacante-direito'],
  // Society 7x7
  '2-3-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '3-2-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro', 'zagueiro-direito', 'meia-esquerdo', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '2-2-3': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'meia-esquerdo', 'meia-direito', 'atacante-esquerdo', 'atacante-centro', 'atacante-direito'],
  '3-3-1': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-centro'],
  // Campo 11x11
  '4-3-3': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-esquerdo', 'atacante-centro', 'atacante-direito'],
  '4-4-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro-esquerdo', 'meia-centro-direito', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '3-5-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro', 'zagueiro-direito', 'meia-esquerdo', 'meia-centro-esquerdo', 'meia-centro', 'meia-centro-direito', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '4-2-3-1': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'zagueiro-direito', 'volante-esquerdo', 'volante-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-centro'],
};

export const positionSlotLabels: Record<string, string> = {
  'goleiro': 'GOL',
  'zagueiro-esquerdo': 'ZAG',
  'zagueiro-centro': 'ZAG',
  'zagueiro-centro-esquerdo': 'ZAG',
  'zagueiro-centro-direito': 'ZAG',
  'zagueiro-direito': 'ZAG',
  'lateral-esquerdo': 'LAT',
  'lateral-direito': 'LAT',
  'volante': 'VOL',
  'volante-esquerdo': 'VOL',
  'volante-direito': 'VOL',
  'meia-esquerdo': 'MEI',
  'meia-centro': 'MEI',
  'meia-centro-esquerdo': 'MEI',
  'meia-centro-direito': 'MEI',
  'meia-direito': 'MEI',
  'atacante-esquerdo': 'ATA',
  'atacante-centro': 'ATA',
  'atacante-direito': 'ATA',
  'banco': 'BANCO',
};
