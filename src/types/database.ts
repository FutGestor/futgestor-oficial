// Tipos estritos baseados na estrutura do Supabase
// Estes tipos refletem as tabelas e views do banco de dados

// ============================================
// TIPOS BASE
// ============================================

export interface Time {
  id: string;
  nome: string;
  apelido: string | null;
  escudo_url: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  is_casa: boolean;
  team_id: string | null;
  cores_principais: string | null;
  redes_sociais: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Jogo {
  id: string;
  team_id: string;
  data_hora: string;
  local: string | null;
  status: "agendado" | "confirmado" | "cancelado" | "concluido";
  time_adversario_id: string | null;
  time_adversario?: Time | null;
  gols_marcados: number | null;
  gols_sofridos: number | null;
  created_at: string;
  updated_at: string;
}

export interface Resultado {
  id: string;
  jogo_id: string;
  team_id: string;
  gols_marcados: number;
  gols_sofridos: number;
  mvp_jogador_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstatisticaPartida {
  id: string;
  resultado_id: string;
  jogador_id: string;
  team_id: string;
  gols: number;
  assistencias: number;
  cartao_amarelo: boolean;
  cartao_vermelho: boolean;
  participou: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstatisticasJogador {
  jogador_id: string;
  jogos: number;
  gols: number;
  assistencias: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  media_gols?: number;
}

export interface Jogador {
  id: string;
  nome: string;
  apelido: string | null;
  email: string | null;
  telefone: string | null;
  posicao: string;
  numero: number | null;
  foto_url: string | null;
  ativo: boolean;
  team_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JogadorPublico {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: string;
  numero: number | null;
  foto_url: string | null;
  ativo: boolean;
  team_id: string;
}

export interface Escalacao {
  id: string;
  jogo_id: string;
  team_id: string;
  formacao: string;
  modalidade: string;
  jogadores_por_posicao: Record<string, string>;
  banco: string[];
  publicada: boolean;
  status_escalacao: "pendente" | "confirmada" | "publicada";
  created_at: string;
  updated_at: string;
}

export interface EscalacaoJogador {
  id: string;
  escalacao_id: string;
  jogador_id: string;
  posicao: string;
  ordem: number;
  created_at: string;
}

export interface Transacao {
  id: string;
  team_id: string;
  tipo: "receita" | "despesa";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  comprovante_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  transacoes_count: number;
}

export interface Aviso {
  id: string;
  team_id: string;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TIPOS PARA VIEWS E RPCs
// ============================================

export interface ViewCraqueJogo {
  jogo_id: string;
  jogador_id: string;
  votos: number;
}

export interface JogoComTimeAdversario extends Jogo {
  time_adversario: {
    id: string;
    nome: string;
    apelido: string | null;
    escudo_url: string | null;
  } | null;
}

export interface ResultadoComJogo extends Resultado {
  jogo: Jogo & { time_adversario?: Time | null };
  estatisticas_partida: (EstatisticaPartida & { 
    jogador?: { nome: string; apelido: string | null } 
  })[];
}

export interface EscalacaoComJogo extends Escalacao {
  jogo: Jogo & { time_adversario?: Time | null };
}

export interface RankingJogador {
  jogador: Jogador;
  gols: number;
  assistencias: number;
  jogos: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  media_gols: number;
}

export interface RankingMVP {
  jogador: {
    id: string;
    nome: string;
    apelido: string | null;
    foto_url: string | null;
  };
  votos: number;
}

export interface PlayerPerformance {
  playerStats: Array<{
    gols: number;
    assistencias: number;
    participou: boolean;
    cartao_amarelo: boolean;
    cartao_vermelho: boolean;
    resultado: {
      mvp_jogador_id: string | null;
      jogo: {
        data_hora: string;
      };
    };
  }>;
  teamStats: Array<{
    gols: number;
    assistencias: number;
    participou: boolean;
    jogador_id: string;
  }>;
}
