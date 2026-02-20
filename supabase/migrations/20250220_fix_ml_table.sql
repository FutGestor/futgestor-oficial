-- ============================================
-- CORREÇÃO DA TABELA ML_ESCALACAO_PADROES
-- ============================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS ml_escalacao_padroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    formacao VARCHAR(10) NOT NULL,
    posicao_campo VARCHAR(10) NOT NULL,
    jogador_id UUID NOT NULL,
    frequencia INTEGER DEFAULT 1,
    eficiencia NUMERIC(5,2) DEFAULT 0,
    gols_por_jogo NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_team ON ml_escalacao_padroes(team_id);
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_formacao ON ml_escalacao_padroes(formacao);

-- 3. Habilitar RLS
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Admins podem gerenciar padrões" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Usuários podem ver padrões" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Enable read access for all users" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ml_escalacao_padroes;

-- 5. Criar políticas permissivas
-- Permitir SELECT para todos (autenticados ou não)
CREATE POLICY "Enable read access for all users"
    ON ml_escalacao_padroes FOR SELECT
    USING (true);

-- Permitir INSERT/UPDATE/DELETE para usuários autenticados
CREATE POLICY "Enable all access for authenticated users"
    ON ml_escalacao_padroes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Garantir permissões na tabela
GRANT SELECT ON ml_escalacao_padroes TO anon;
GRANT SELECT ON ml_escalacao_padroes TO authenticated;
GRANT ALL ON ml_escalacao_padroes TO authenticated;
