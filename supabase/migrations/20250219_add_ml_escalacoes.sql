-- Migration: Tabela para Machine Learning de escalações
-- Armazena padrões de escalação do admin para sugerir futuras escalações
-- Data: 2026-02-19

-- 1. Tabela de padrões de escalação (aprendizado)
CREATE TABLE IF NOT EXISTS ml_escalacao_padroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    formacao VARCHAR(20) NOT NULL,
    posicao_campo VARCHAR(10) NOT NULL, -- 'GOL', 'ZAG', 'VOL', etc
    jogador_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
    frequencia INTEGER DEFAULT 1, -- quantas vezes esse jogador foi escalado nessa posição
    ultima_escalacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, formacao, posicao_campo, jogador_id)
);

-- 2. Tabela de preferências de posição por jogador
CREATE TABLE IF NOT EXISTS ml_jogador_posicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jogador_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
    posicao_campo VARCHAR(10) NOT NULL,
    eficiencia DECIMAL(3,2) DEFAULT 0.00, -- média de notas nessa posição (0-10)
    gols_por_jogo DECIMAL(4,2) DEFAULT 0.00,
    jogos_na_posicao INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(jogador_id, posicao_campo)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_ml_padroes_team ON ml_escalacao_padroes(team_id);
CREATE INDEX IF NOT EXISTS idx_ml_padroes_formacao ON ml_escalacao_padroes(formacao);
CREATE INDEX IF NOT EXISTS idx_ml_padroes_freq ON ml_escalacao_padroes(frequencia DESC);
CREATE INDEX IF NOT EXISTS idx_ml_jogador_pos ON ml_jogador_posicoes(jogador_id);
CREATE INDEX IF NOT EXISTS idx_ml_jogador_efic ON ml_jogador_posicoes(eficiencia DESC);

-- 4. Função para atualizar padrões quando uma escalação é criada/atualizada
CREATE OR REPLACE FUNCTION atualizar_ml_escalacao_padroes()
RETURNS TRIGGER AS $$
BEGIN
    -- Para cada posição na escalação, atualizar ou inserir o padrão
    -- Isso será chamado pelo aplicativo, não diretamente no trigger
    -- pois precisamos processar o JSON de jogadores_por_posicao
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para calcular eficiência do jogador em uma posição
CREATE OR REPLACE FUNCTION calcular_eficiencia_jogador(
    p_jogador_id UUID,
    p_posicao VARCHAR(10)
) RETURNS DECIMAL AS $$
DECLARE
    v_media_notas DECIMAL(3,2);
    v_jogos INTEGER;
BEGIN
    -- Calcular média de notas do jogador quando jogou nessa posição
    SELECT 
        COALESCE(AVG(n.nota), 0),
        COUNT(*)
    INTO v_media_notas, v_jogos
    FROM notas_jogadores n
    JOIN escalacoes e ON n.escalacao_id = e.id
    WHERE n.jogador_id = p_jogador_id
    AND e.formacao LIKE '%' || p_posicao || '%';
    -- Nota: essa é uma simplificação, idealmente teríamos a posição exata
    
    RETURN v_media_notas;
END;
$$ LANGUAGE plpgsql;

-- 6. View para sugestão de escalação
CREATE OR REPLACE VIEW vw_sugestao_escalacao AS
SELECT 
    p.team_id,
    p.formacao,
    p.posicao_campo,
    p.jogador_id,
    p.frequencia,
    COALESCE(jp.eficiencia, 5.00) as eficiencia,
    COALESCE(jp.gols_por_jogo, 0) as gols_por_jogo,
    p.ultima_escalacao
FROM ml_escalacao_padroes p
LEFT JOIN ml_jogador_posicoes jp ON p.jogador_id = jp.jogador_id AND p.posicao_campo = jp.posicao_campo
ORDER BY p.frequencia DESC, jp.eficiencia DESC;

-- 7. Comentários
COMMENT ON TABLE ml_escalacao_padroes IS 'Padrões de escalação do admin para ML';
COMMENT ON TABLE ml_jogador_posicoes IS 'Eficiência de jogadores por posição para ML';
COMMENT ON VIEW vw_sugestao_escalacao IS 'View para sugerir escalação baseada em padrões';
