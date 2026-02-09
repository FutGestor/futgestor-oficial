export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aviso_leituras: {
        Row: {
          aviso_id: string
          id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          id?: string
          lido_em?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_leituras_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          categoria: Database["public"]["Enums"]["notice_category"] | null
          conteudo: string
          created_at: string
          id: string
          publicado: boolean | null
          team_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["notice_category"] | null
          conteudo: string
          created_at?: string
          id?: string
          publicado?: boolean | null
          team_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["notice_category"] | null
          conteudo?: string
          created_at?: string
          id?: string
          publicado?: boolean | null
          team_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_anexos: {
        Row: {
          chamado_id: string
          criado_em: string
          id: string
          mensagem_id: string | null
          nome_arquivo: string
          url: string
        }
        Insert: {
          chamado_id: string
          criado_em?: string
          id?: string
          mensagem_id?: string | null
          nome_arquivo: string
          url: string
        }
        Update: {
          chamado_id?: string
          criado_em?: string
          id?: string
          mensagem_id?: string | null
          nome_arquivo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_anexos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_anexos_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "chamado_mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_mensagens: {
        Row: {
          chamado_id: string
          criado_em: string
          id: string
          is_admin: boolean | null
          mensagem: string
          user_id: string
        }
        Insert: {
          chamado_id: string
          criado_em?: string
          id?: string
          is_admin?: boolean | null
          mensagem: string
          user_id: string
        }
        Update: {
          chamado_id?: string
          criado_em?: string
          id?: string
          is_admin?: boolean | null
          mensagem?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_mensagens_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          assunto: string
          atualizado_em: string
          categoria: string
          criado_em: string
          descricao: string
          id: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          assunto: string
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          descricao: string
          id?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          assunto?: string
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          descricao?: string
          id?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmacoes_presenca: {
        Row: {
          created_at: string
          id: string
          jogador_id: string
          jogo_id: string
          status: Database["public"]["Enums"]["presence_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jogador_id: string
          jogo_id: string
          status?: Database["public"]["Enums"]["presence_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jogador_id?: string
          jogo_id?: string
          status?: Database["public"]["Enums"]["presence_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmacoes_presenca_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmacoes_presenca_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmacoes_presenca_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmacoes_presenca_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      escalacao_jogadores: {
        Row: {
          created_at: string
          escalacao_id: string
          id: string
          jogador_id: string
          ordem: number
          posicao_campo: string
        }
        Insert: {
          created_at?: string
          escalacao_id: string
          id?: string
          jogador_id: string
          ordem?: number
          posicao_campo: string
        }
        Update: {
          created_at?: string
          escalacao_id?: string
          id?: string
          jogador_id?: string
          ordem?: number
          posicao_campo?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalacao_jogadores_escalacao_id_fkey"
            columns: ["escalacao_id"]
            isOneToOne: false
            referencedRelation: "escalacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalacao_jogadores_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalacao_jogadores_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      escalacoes: {
        Row: {
          created_at: string
          formacao: string | null
          id: string
          jogo_id: string
          modalidade: string | null
          publicada: boolean | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          formacao?: string | null
          id?: string
          jogo_id: string
          modalidade?: string | null
          publicada?: boolean | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          formacao?: string | null
          id?: string
          jogo_id?: string
          modalidade?: string | null
          publicada?: boolean | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalacoes_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: true
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalacoes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      estatisticas_partida: {
        Row: {
          assistencias: number
          cartao_amarelo: boolean
          cartao_vermelho: boolean
          created_at: string
          gols: number
          id: string
          jogador_id: string
          participou: boolean
          resultado_id: string
          team_id: string | null
        }
        Insert: {
          assistencias?: number
          cartao_amarelo?: boolean
          cartao_vermelho?: boolean
          created_at?: string
          gols?: number
          id?: string
          jogador_id: string
          participou?: boolean
          resultado_id: string
          team_id?: string | null
        }
        Update: {
          assistencias?: number
          cartao_amarelo?: boolean
          cartao_vermelho?: boolean
          created_at?: string
          gols?: number
          id?: string
          jogador_id?: string
          participou?: boolean
          resultado_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estatisticas_partida_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estatisticas_partida_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estatisticas_partida_resultado_id_fkey"
            columns: ["resultado_id"]
            isOneToOne: false
            referencedRelation: "resultados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estatisticas_partida_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      jogadores: {
        Row: {
          apelido: string | null
          ativo: boolean | null
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          nome: string
          numero: number | null
          posicao: Database["public"]["Enums"]["player_position"]
          team_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          numero?: number | null
          posicao: Database["public"]["Enums"]["player_position"]
          team_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          apelido?: string | null
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          numero?: number | null
          posicao?: Database["public"]["Enums"]["player_position"]
          team_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jogadores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      jogos: {
        Row: {
          adversario: string
          created_at: string
          data_hora: string
          id: string
          local: string
          observacoes: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          team_id: string | null
          temporada: string | null
          time_adversario_id: string | null
          updated_at: string
        }
        Insert: {
          adversario: string
          created_at?: string
          data_hora: string
          id?: string
          local: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          team_id?: string | null
          temporada?: string | null
          time_adversario_id?: string | null
          updated_at?: string
        }
        Update: {
          adversario?: string
          created_at?: string
          data_hora?: string
          id?: string
          local?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          team_id?: string | null
          temporada?: string | null
          time_adversario_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jogos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jogos_time_adversario_id_fkey"
            columns: ["time_adversario_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      league_matches: {
        Row: {
          created_at: string
          id: string
          league_id: string
          round: number
          score_away: number | null
          score_home: number | null
          status: string
          team_away_id: string
          team_home_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          round?: number
          score_away?: number | null
          score_home?: number | null
          status?: string
          team_away_id: string
          team_home_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          round?: number
          score_away?: number | null
          score_home?: number | null
          status?: string
          team_away_id?: string
          team_home_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_team_away_id_fkey"
            columns: ["team_away_id"]
            isOneToOne: false
            referencedRelation: "league_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_team_home_id_fkey"
            columns: ["team_home_id"]
            isOneToOne: false
            referencedRelation: "league_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      league_teams: {
        Row: {
          created_at: string
          id: string
          league_id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_financeiro: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          jogador_id: string
          pago: boolean
          team_id: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          jogador_id: string
          pago?: boolean
          team_id?: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          jogador_id?: string
          pago?: boolean
          team_id?: string | null
          tipo?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_financeiro_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_financeiro_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_financeiro_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      presenca_links: {
        Row: {
          codigo: string
          created_at: string
          id: string
          jogo_id: string
          team_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          jogo_id: string
          team_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          jogo_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presenca_links_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: true
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenca_links_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          id: string
          jogador_id: string
          presenca_link_id: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          jogador_id: string
          presenca_link_id: string
          status: string
          updated_at?: string
        }
        Update: {
          id?: string
          jogador_id?: string
          presenca_link_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_presenca_link_id_fkey"
            columns: ["presenca_link_id"]
            isOneToOne: false
            referencedRelation: "presenca_links"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado: boolean
          created_at: string
          id: string
          jogador_id: string | null
          nome: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          id: string
          jogador_id?: string | null
          nome?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          id?: string
          jogador_id?: string | null
          nome?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          created_at: string
          gols_contra: number
          gols_favor: number
          id: string
          jogo_id: string
          mvp_jogador_id: string | null
          observacoes: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gols_contra?: number
          gols_favor?: number
          id?: string
          jogo_id: string
          mvp_jogador_id?: string | null
          observacoes?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gols_contra?: number
          gols_favor?: number
          id?: string
          jogo_id?: string
          mvp_jogador_id?: string | null
          observacoes?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultados_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: true
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_mvp_jogador_id_fkey"
            columns: ["mvp_jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_mvp_jogador_id_fkey"
            columns: ["mvp_jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_payments: {
        Row: {
          created_at: string
          id: string
          metodo: string | null
          mp_payment_id: string | null
          plano: string
          status: string
          team_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          metodo?: string | null
          mp_payment_id?: string | null
          plano: string
          status?: string
          team_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          metodo?: string | null
          mp_payment_id?: string | null
          plano?: string
          status?: string
          team_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saas_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_jogo: {
        Row: {
          created_at: string
          data_preferida: string
          email_contato: string | null
          horario_preferido: string
          id: string
          ip_address: string | null
          local_sugerido: string
          nome_time: string
          observacoes: string | null
          status: Database["public"]["Enums"]["request_status"]
          team_id: string | null
          telefone_contato: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_preferida: string
          email_contato?: string | null
          horario_preferido: string
          id?: string
          ip_address?: string | null
          local_sugerido: string
          nome_time: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          team_id?: string | null
          telefone_contato: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_preferida?: string
          email_contato?: string | null
          horario_preferido?: string
          id?: string
          ip_address?: string | null
          local_sugerido?: string
          nome_time?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          team_id?: string | null
          telefone_contato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_jogo_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          mp_preference_id: string | null
          mp_subscription_id: string | null
          plano: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          mp_preference_id?: string | null
          mp_subscription_id?: string | null
          plano?: string
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          mp_preference_id?: string | null
          mp_subscription_id?: string | null
          plano?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sensitive_data: {
        Row: {
          cpf_responsavel: string | null
          created_at: string
          team_id: string
        }
        Insert: {
          cpf_responsavel?: string | null
          created_at?: string
          team_id: string
        }
        Update: {
          cpf_responsavel?: string | null
          created_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sensitive_data_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          banner_url: string | null
          cores: Json | null
          created_at: string
          escudo_url: string | null
          id: string
          nome: string
          plano: string
          redes_sociais: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          cores?: Json | null
          created_at?: string
          escudo_url?: string | null
          id?: string
          nome: string
          plano?: string
          redes_sociais?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          cores?: Json | null
          created_at?: string
          escudo_url?: string | null
          id?: string
          nome?: string
          plano?: string
          redes_sociais?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      times: {
        Row: {
          apelido: string | null
          ativo: boolean
          cidade: string | null
          cores_principais: string | null
          created_at: string
          escudo_url: string | null
          id: string
          is_casa: boolean
          nome: string
          redes_sociais: Json | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean
          cidade?: string | null
          cores_principais?: string | null
          created_at?: string
          escudo_url?: string | null
          id?: string
          is_casa?: boolean
          nome: string
          redes_sociais?: Json | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          ativo?: boolean
          cidade?: string | null
          cores_principais?: string | null
          created_at?: string
          escudo_url?: string | null
          id?: string
          is_casa?: boolean
          nome?: string
          redes_sociais?: Json | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "times_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          team_id: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          team_id?: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          team_id?: string | null
          tipo?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      votos_destaque: {
        Row: {
          created_at: string
          id: string
          jogador_id: string
          resultado_id: string
          team_id: string | null
          updated_at: string
          votante_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jogador_id: string
          resultado_id: string
          team_id?: string | null
          updated_at?: string
          votante_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jogador_id?: string
          resultado_id?: string
          team_id?: string | null
          updated_at?: string
          votante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_destaque_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_destaque_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "jogadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_destaque_resultado_id_fkey"
            columns: ["resultado_id"]
            isOneToOne: false
            referencedRelation: "resultados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_destaque_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      jogadores_public: {
        Row: {
          apelido: string | null
          ativo: boolean | null
          foto_url: string | null
          id: string | null
          nome: string | null
          numero: number | null
          posicao: Database["public"]["Enums"]["player_position"] | null
          team_id: string | null
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean | null
          foto_url?: string | null
          id?: string | null
          nome?: string | null
          numero?: number | null
          posicao?: Database["public"]["Enums"]["player_position"] | null
          team_id?: string | null
        }
        Update: {
          apelido?: string | null
          ativo?: boolean | null
          foto_url?: string | null
          id?: string | null
          nome?: string | null
          numero?: number | null
          posicao?: Database["public"]["Enums"]["player_position"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jogadores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions_public: {
        Row: {
          expires_at: string | null
          plano: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          expires_at?: string | null
          plano?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          expires_at?: string | null
          plano?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_solicitacao_rate_limit: { Args: { p_ip: string }; Returns: boolean }
      get_user_team_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      game_status:
        | "agendado"
        | "confirmado"
        | "em_andamento"
        | "finalizado"
        | "cancelado"
      notice_category: "geral" | "urgente" | "financeiro" | "jogo"
      player_position:
        | "goleiro"
        | "zagueiro"
        | "lateral"
        | "volante"
        | "meia"
        | "atacante"
      presence_status: "confirmado" | "indisponivel" | "pendente"
      request_status: "pendente" | "aceita" | "recusada"
      transaction_type: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "super_admin"],
      game_status: [
        "agendado",
        "confirmado",
        "em_andamento",
        "finalizado",
        "cancelado",
      ],
      notice_category: ["geral", "urgente", "financeiro", "jogo"],
      player_position: [
        "goleiro",
        "zagueiro",
        "lateral",
        "volante",
        "meia",
        "atacante",
      ],
      presence_status: ["confirmado", "indisponivel", "pendente"],
      request_status: ["pendente", "aceita", "recusada"],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const
