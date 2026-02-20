// Tipos estritos para a tabela teams do Supabase
// Baseado na estrutura real do banco de dados

export interface TeamColors {
  primary?: string;
  secondary?: string;
  [key: string]: string | undefined;
}

export interface TeamRedesSociais {
  instagram?: string;
  whatsapp?: string;
  youtube?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

export interface TeamBioConfig {
  text: string | null;
  color: string;
  fontSize: string;
  fontWeight: string;
  textAlign: string;
  fontFamily: string;
  titleColor?: string;
  titleStroke?: boolean;
  titleStrokeColor?: string;
  titleStrokeWidth?: number;
  bioStroke?: boolean;
  bioStrokeColor?: string;
  bioStrokeWidth?: number;
}

// Tipo principal da tabela teams
export interface Team {
  id: string;
  nome: string;
  slug: string;
  escudo_url: string | null;
  banner_url: string | null;
  cidade: string | null;
  estado: string | null;
  invite_code: string | null;
  owner_contact: string | null;
  plano: string;
  cores: TeamColors | null;
  redes_sociais: TeamRedesSociais | null;
  bio_config: TeamBioConfig | null;
  created_at: string;
  updated_at: string;
}

// Tipo usado no contexto de slug
export interface TeamSlugData {
  id: string;
  nome: string;
  slug: string;
  escudo_url: string | null;
  banner_url: string | null;
  cidade: string | null;
  estado: string | null;
  cores: TeamColors | null;
  invite_code: string | null;
  owner_contact: string | null;
  redes_sociais: TeamRedesSociais;
  bio_config: TeamBioConfig | null;
}

// Tipo de configuração usado em useTeamConfig
export interface TeamConfig {
  id: string | null;
  nome: string;
  slug: string | null;
  escudo_url: string | null;
  banner_url: string | null;
  cidade: string | null;
  estado: string | null;
  invite_code: string | null;
  owner_contact: string | null;
  redes_sociais: TeamRedesSociais;
  cores: TeamColors | null;
  bio_config: TeamBioConfig | null;
}
