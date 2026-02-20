// ============================================
// TIPOS ESTRITOS PARA SUPER ADMIN
// ============================================

/** Dados de um usuário retornados pela RPC get_admin_users_full */
export interface AdminUserFull {
  id: string;
  email: string;
  nome: string | null;
  created_at: string;
  team_id: string | null;
  plano: string | null;
  trial_ends_at: string | null;
  is_blocked: boolean;
}

/** Usuário com dados enriquecidos para exibição */
export interface AdminUserView {
  id: string;
  email: string;
  nome: string | null;
  created_at: string;
  team_id: string | null;
  team_name: string | null;
  team_slug: string | null;
  plano: string | null;
  trial_ends_at: string | null;
  is_blocked: boolean;
  roles: string[];
}

/** Parâmetros para deletar usuário */
export interface AdminDeleteUserParams {
  _user_id: string;
}

/** Parâmetros para definir plano */
export interface AdminSetPlanParams {
  _user_id: string;
  _plan: string;
}

/** Resposta das funções RPC admin */
export interface AdminRPCResponse {
  success: boolean;
  message?: string;
}

/** Filtros de busca para usuários admin */
export interface AdminUserFilters {
  search: string;
  planFilter: string;
  roleFilter: string;
  sortBy: 'created' | 'name' | 'plan';
  sortOrder: 'asc' | 'desc';
}
