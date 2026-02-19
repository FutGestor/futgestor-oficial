-- Migration: Adicionar sistema de escalação provável e integração com jogos
-- Data: 2026-02-19

-- 1. Adicionar campo status_escalacao na tabela escalacoes
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS status_escalacao VARCHAR(20) DEFAULT 'provavel' 
CHECK (status_escalacao IN ('provavel', 'confirmada', 'publicada'));

-- 2. Adicionar flag tem_escalacao na tabela jogos
ALTER TABLE jogos 
ADD COLUMN IF NOT EXISTS tem_escalacao BOOLEAN DEFAULT false;

-- 3. Adicionar campo para rastrear quando a escalação foi finalizada
ALTER TABLE escalacoes 
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE;

-- 4. Criar índice para buscar jogos do dia com escalação pendente
CREATE INDEX IF NOT EXISTS idx_jogos_data_hora ON jogos(data_hora);
CREATE INDEX IF NOT EXISTS idx_escalacoes_status ON escalacoes(status_escalacao);

-- 5. Criar função para atualizar tem_escalacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_tem_escalacao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jogos SET tem_escalacao = true WHERE id = NEW.jogo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jogos SET tem_escalacao = false WHERE id = OLD.jogo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para manter tem_escalacao sincronizado
DROP TRIGGER IF EXISTS trigger_atualizar_tem_escalacao ON escalacoes;
CREATE TRIGGER trigger_atualizar_tem_escalacao
    AFTER INSERT OR DELETE ON escalacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_tem_escalacao();

-- 7. Atualizar registros existentes
UPDATE escalacoes SET status_escalacao = 'publicada' WHERE publicada = true;
UPDATE escalacoes SET status_escalacao = 'confirmada' WHERE publicada = false;
UPDATE jogos SET tem_escalacao = true WHERE id IN (SELECT jogo_id FROM escalacoes);

-- 8. Comentários para documentação
COMMENT ON COLUMN escalacoes.status_escalacao IS 'Status da escalação: provavel, confirmada, publicada';
COMMENT ON COLUMN jogos.tem_escalacao IS 'Indica se o jogo possui uma escalação criada';
COMMENT ON COLUMN escalacoes.data_confirmacao IS 'Data em que a escalação foi confirmada pelo admin';
