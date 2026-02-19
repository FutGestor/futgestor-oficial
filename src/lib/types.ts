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
  pe_preferido: 'destro' | 'canhoto' | 'ambos' | null;
  peso_kg: number | null;
  altura_cm: number | null;
  bio: string | null;
  data_entrada: string | null;
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
  pe_preferido: 'destro' | 'canhoto' | 'ambos' | null;
  peso_kg: number | null;
  altura_cm: number | null;
  bio: string | null;
  data_entrada: string | null;
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
  uf: string | null;
  cep: string | null;
  is_casa: boolean;
  ativo: boolean;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoJogo = 'amistoso' | 'campeonato' | 'copa' | 'torneio' | 'outro';
export type MandoJogo = 'mandante' | 'visitante';

export interface Jogo {
  id: string;
  data_hora: string;
  local: string;
  adversario: string;
  status: GameStatus;
  tipo_jogo: TipoJogo | null;
  mando: MandoJogo | null;
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

export const tipoJogoLabels: Record<TipoJogo, string> = {
  amistoso: 'Amistoso',
  campeonato: 'Campeonato',
  copa: 'Copa',
  torneio: 'Torneio',
  outro: 'Outro',
};

export const mandoLabels: Record<MandoJogo, string> = {
  mandante: 'Mandante',
  visitante: 'Visitante',
};

// Society/Campo modality types
export type GameModality = 'society-5' | 'society-6' | 'society-7' | 'campo-11' | 'futsal';

export const modalityLabels: Record<GameModality, string> = {
  'society-5': 'Society 5x5 (6 jogadores)',
  'society-6': 'Society 6x6 (7 jogadores)',
  'society-7': 'Society 7x7 (8 jogadores)',
  'campo-11': 'Campo 11x11 (11 jogadores)',
  'futsal': 'Futsal 5x5 (5 jogadores)',
};

export const formacoesPorModalidade: Record<GameModality, string[]> = {
  'society-5': ['2-2-1', '1-2-2', '2-1-2', '1-3-1'],
  'society-6': ['2-2-2', '2-3-1', '3-2-1', '2-1-3'],
  'society-7': ['2-3-2', '3-2-2', '2-2-3', '3-3-1'],
  'campo-11': ['4-3-3', '4-4-2', '3-5-2', '4-1-4-1', '4-2-3-1'],
  'futsal': ['1-2-1', '2-2', '3-1'],
};

// Mapeamento de posições por FORMAÇÃO (dinâmico)
export const formationPositions: Record<string, Record<string, { top: string; left: string }>> = {
  // Society 5x5 (5 jogadores de linha + goleiro = 6) - Ajustado
  '2-2-1': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-esquerdo': { top: '45%', left: '30%' },
    'meia-direito': { top: '45%', left: '70%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  '1-2-2': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-centro': { top: '72%', left: '50%' },
    'meia-esquerdo': { top: '45%', left: '30%' },
    'meia-direito': { top: '45%', left: '70%' },
    'atacante-esquerdo': { top: '18%', left: '30%' },
    'atacante-direito': { top: '18%', left: '70%' },
  },
  '2-1-2': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-centro': { top: '45%', left: '50%' },
    'atacante-esquerdo': { top: '18%', left: '30%' },
    'atacante-direito': { top: '18%', left: '70%' },
  },
  '1-3-1': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-centro': { top: '72%', left: '50%' },
    'meia-esquerdo': { top: '45%', left: '22%' },
    'meia-centro': { top: '45%', left: '50%' },
    'meia-direito': { top: '45%', left: '78%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  // Society 6x6 (6 jogadores de linha + goleiro = 7) - Ajustado
  '2-2-2': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-esquerdo': { top: '45%', left: '30%' },
    'meia-direito': { top: '45%', left: '70%' },
    'atacante-esquerdo': { top: '18%', left: '30%' },
    'atacante-direito': { top: '18%', left: '70%' },
  },
  '2-3-1': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-esquerdo': { top: '45%', left: '22%' },
    'meia-centro': { top: '45%', left: '50%' },
    'meia-direito': { top: '45%', left: '78%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  '3-2-1': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '22%' },
    'zagueiro-centro': { top: '72%', left: '50%' },
    'zagueiro-direito': { top: '72%', left: '78%' },
    'meia-esquerdo': { top: '45%', left: '30%' },
    'meia-direito': { top: '45%', left: '70%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  '2-1-3': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-centro': { top: '45%', left: '50%' },
    'atacante-esquerdo': { top: '18%', left: '22%' },
    'atacante-centro': { top: '18%', left: '50%' },
    'atacante-direito': { top: '18%', left: '78%' },
  },
  // Society 7x7 (7 jogadores de linha + goleiro = 8) - Ajustado
  '2-3-2': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-esquerdo': { top: '48%', left: '22%' },
    'meia-centro': { top: '48%', left: '50%' },
    'meia-direito': { top: '48%', left: '78%' },
    'atacante-esquerdo': { top: '20%', left: '30%' },
    'atacante-direito': { top: '20%', left: '70%' },
  },
  '3-2-2': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '22%' },
    'zagueiro-centro': { top: '72%', left: '50%' },
    'zagueiro-direito': { top: '72%', left: '78%' },
    'meia-esquerdo': { top: '48%', left: '30%' },
    'meia-direito': { top: '48%', left: '70%' },
    'atacante-esquerdo': { top: '20%', left: '30%' },
    'atacante-direito': { top: '20%', left: '70%' },
  },
  '2-2-3': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '30%' },
    'zagueiro-direito': { top: '72%', left: '70%' },
    'meia-esquerdo': { top: '48%', left: '30%' },
    'meia-direito': { top: '48%', left: '70%' },
    'atacante-esquerdo': { top: '20%', left: '22%' },
    'atacante-centro': { top: '20%', left: '50%' },
    'atacante-direito': { top: '20%', left: '78%' },
  },
  '3-3-1': {
    'goleiro': { top: '92%', left: '50%' },
    'zagueiro-esquerdo': { top: '72%', left: '22%' },
    'zagueiro-centro': { top: '72%', left: '50%' },
    'zagueiro-direito': { top: '72%', left: '78%' },
    'meia-esquerdo': { top: '48%', left: '22%' },
    'meia-centro': { top: '48%', left: '50%' },
    'meia-direito': { top: '48%', left: '78%' },
    'atacante-centro': { top: '20%', left: '50%' },
  },
  // Campo 11x11 - Ajustado para melhor distribuição visual
  '4-3-3': {
    'goleiro': { top: '94%', left: '50%' },
    'lateral-esquerdo': { top: '78%', left: '12%' },
    'zagueiro-centro-esquerdo': { top: '82%', left: '35%' },
    'zagueiro-centro-direito': { top: '82%', left: '65%' },
    'lateral-direito': { top: '78%', left: '88%' },
    'volante': { top: '60%', left: '50%' },
    'meia-centro-esquerdo': { top: '48%', left: '28%' },
    'meia-centro-direito': { top: '48%', left: '72%' },
    'ponta-esquerdo': { top: '25%', left: '12%' },
    'atacante-centro': { top: '18%', left: '50%' },
    'ponta-direito': { top: '25%', left: '88%' },
  },
  '4-4-2': {
    'goleiro': { top: '94%', left: '50%' },
    'lateral-esquerdo': { top: '78%', left: '12%' },
    'zagueiro-centro-esquerdo': { top: '82%', left: '35%' },
    'zagueiro-centro-direito': { top: '82%', left: '65%' },
    'lateral-direito': { top: '78%', left: '88%' },
    'meia-esquerdo': { top: '52%', left: '12%' },
    'volante-esquerdo': { top: '58%', left: '38%' },
    'volante-direito': { top: '58%', left: '62%' },
    'meia-direito': { top: '52%', left: '88%' },
    'atacante-esquerdo': { top: '22%', left: '38%' },
    'atacante-direito': { top: '22%', left: '62%' },
  },
  '3-5-2': {
    'goleiro': { top: '94%', left: '50%' },
    'zagueiro-esquerdo': { top: '80%', left: '22%' },
    'zagueiro-centro': { top: '85%', left: '50%' },
    'zagueiro-direito': { top: '80%', left: '78%' },
    'meia-esquerdo': { top: '52%', left: '12%' },
    'volante-esquerdo': { top: '62%', left: '32%' },
    'meia-centro': { top: '48%', left: '50%' },
    'volante-direito': { top: '62%', left: '68%' },
    'meia-direito': { top: '52%', left: '88%' },
    'atacante-esquerdo': { top: '22%', left: '38%' },
    'atacante-direito': { top: '22%', left: '62%' },
  },
  '4-2-3-1': {
    'goleiro': { top: '94%', left: '50%' },
    'lateral-esquerdo': { top: '78%', left: '12%' },
    'zagueiro-centro-esquerdo': { top: '82%', left: '35%' },
    'zagueiro-centro-direito': { top: '82%', left: '65%' },
    'lateral-direito': { top: '78%', left: '88%' },
    'volante-esquerdo': { top: '65%', left: '38%' },
    'volante-direito': { top: '65%', left: '62%' },
    'meia-esquerdo': { top: '42%', left: '12%' },
    'meia-centro': { top: '45%', left: '50%' },
    'meia-direito': { top: '42%', left: '88%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  '4-1-4-1': {
    'goleiro': { top: '94%', left: '50%' },
    'lateral-esquerdo': { top: '78%', left: '12%' },
    'zagueiro-centro-esquerdo': { top: '82%', left: '35%' },
    'zagueiro-centro-direito': { top: '82%', left: '65%' },
    'lateral-direito': { top: '78%', left: '88%' },
    'volante': { top: '62%', left: '50%' },
    'meia-esquerdo': { top: '48%', left: '12%' },
    'meia-centro-esquerdo': { top: '48%', left: '35%' },
    'meia-centro-direito': { top: '48%', left: '65%' },
    'meia-direito': { top: '48%', left: '88%' },
    'atacante-centro': { top: '18%', left: '50%' },
  },
  // Futsal
  '1-2-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'meia-esquerdo': { top: '42%', left: '25%' },
    'meia-direito': { top: '42%', left: '75%' },
    'atacante-centro': { top: '15%', left: '50%' },
  },
  '2-2': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-esquerdo': { top: '68%', left: '35%' },
    'zagueiro-direito': { top: '68%', left: '65%' },
    'atacante-esquerdo': { top: '25%', left: '35%' },
    'atacante-direito': { top: '25%', left: '65%' },
  },
  '3-1': {
    'goleiro': { top: '88%', left: '50%' },
    'zagueiro-centro': { top: '68%', left: '50%' },
    'lateral-esquerdo': { top: '55%', left: '20%' },
    'lateral-direito': { top: '55%', left: '80%' },
    'atacante-centro': { top: '15%', left: '50%' },
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
  '4-3-3': ['goleiro', 'lateral-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'lateral-direito', 'volante', 'meia-centro-esquerdo', 'meia-centro-direito', 'ponta-esquerdo', 'atacante-centro', 'ponta-direito'],
  '4-4-2': ['goleiro', 'lateral-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'lateral-direito', 'meia-esquerdo', 'volante-esquerdo', 'volante-direito', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '3-5-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-centro', 'zagueiro-direito', 'meia-esquerdo', 'volante-esquerdo', 'meia-centro', 'volante-direito', 'meia-direito', 'atacante-esquerdo', 'atacante-direito'],
  '4-2-3-1': ['goleiro', 'lateral-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'lateral-direito', 'volante-esquerdo', 'volante-direito', 'meia-esquerdo', 'meia-centro', 'meia-direito', 'atacante-centro'],
  '4-1-4-1': ['goleiro', 'lateral-esquerdo', 'zagueiro-centro-esquerdo', 'zagueiro-centro-direito', 'lateral-direito', 'volante', 'meia-esquerdo', 'meia-centro-esquerdo', 'meia-centro-direito', 'meia-direito', 'atacante-centro'],
  // Futsal
  '1-2-1': ['goleiro', 'zagueiro-centro', 'meia-esquerdo', 'meia-direito', 'atacante-centro'],
  '2-2': ['goleiro', 'zagueiro-esquerdo', 'zagueiro-direito', 'atacante-esquerdo', 'atacante-direito'],
  '3-1': ['goleiro', 'zagueiro-centro', 'lateral-esquerdo', 'lateral-direito', 'atacante-centro'],
};

export const positionSlotLabels: Record<string, string> = {
  'goleiro': 'GOL',
  'zagueiro-esquerdo': 'ZAG',
  'zagueiro-centro': 'ZAG',
  'zagueiro-centro-esquerdo': 'ZAG',
  'zagueiro-centro-direito': 'ZAG',
  'zagueiro-direito': 'ZAG',
  'lateral-esquerdo': 'LTE',
  'lateral-direito': 'LTD',
  'volante': 'VOL',
  'volante-esquerdo': 'VOL',
  'volante-centro': 'VOL',
  'volante-direito': 'VOL',
  'meia-esquerdo': 'ME',
  'meia-centro': 'MEI',
  'meia-direito': 'MD',
  'meia-centro-esquerdo': 'MEI',
  'meia-centro-direito': 'MEI',
  'ponta-esquerdo': 'PTE',
  'ponta-direito': 'PTD',
  'atacante-esquerdo': 'ATA',
  'atacante-centro': 'ATA',
  'atacante-direito': 'ATA',
  'banco': 'BANCO',
};
