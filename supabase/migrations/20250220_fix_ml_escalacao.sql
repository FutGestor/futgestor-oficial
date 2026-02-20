-- ============================================
-- CORREÇÃO DA TABELA ML_ESCALACAO_PADROES
-- ============================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS ml_escalacao_padroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    formacao VARCHAR(10) NOT NULL,
    posicao_campo VARCHAR(10) NOT NULL,
    jogador_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
    frequencia INTEGER DEFAULT 1,
    eficiencia NUMERIC(5,2) DEFAULT 0,
    gols_por_jogo NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, formacao, posicao_campo, jogador_id)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_team ON ml_escalacao_padroes(team_id);
CREATE INDEX IF NOT EXISTS idx_ml_escalacao_formacao ON ml_escalacao_padroes(formacao);

-- 3. Habilitar RLS
ALTER TABLE ml_escalacao_padroes ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Admins podem gerenciar padrões de escalação" ON ml_escalacao_padroes;
DROP POLICY IF EXISTS "Usuários podem ver padrões do seu time" ON ml_escalacao_padroes;

-- 5. Criar políticas
-- Política para admins gerenciarem
CREATE POLICY "Admins podem gerenciar padrões de escalação"
    ON ml_escalacao_padroes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.team_id = ml_escalacao_padroes.team_id
            AND p.is_admin = true
        )
    );

-- Política para todos verem (read-only)
CREATE POLICY "Usuários podem ver padrões do seu time"
    ON ml_escalacao_padroes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.team_id = ml_escalacao_padroes.team_id
        )
    );
