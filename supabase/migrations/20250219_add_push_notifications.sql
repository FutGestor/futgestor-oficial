-- Migration: Tabela para notificações push
-- Data: 2026-02-19

-- 1. Criar tabela de notificações push
CREATE TABLE IF NOT EXISTS notificacoes_push (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'escalacao_pendente', 'jogo_hoje', 'confirmacao_presenca', etc
    dados JSONB DEFAULT '{}', -- dados extras (jogo_id, escalacao_id, etc)
    lida BOOLEAN DEFAULT false,
    enviada BOOLEAN DEFAULT false,
    data_envio TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de tokens de push (para OneSignal/FCM)
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    plataforma VARCHAR(20) NOT NULL CHECK (plataforma IN ('ios', 'android', 'web')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes_push(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes_push(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes_push(tipo);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_ativo ON push_tokens(ativo);

-- 4. RLS (Row Level Security)
ALTER TABLE notificacoes_push ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança
CREATE POLICY "Usuários veem apenas suas notificações" 
    ON notificacoes_push FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam apenas seus tokens" 
    ON push_tokens FOR ALL 
    USING (auth.uid() = user_id);

-- 6. Função para criar notificação de escalação pendente
CREATE OR REPLACE FUNCTION criar_notificacao_escalacao_pendente()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar admins do time quando um jogo é criado sem escalação
    INSERT INTO notificacoes_push (user_id, titulo, mensagem, tipo, dados)
    SELECT 
        p.id,
        'Escalação Pendente',
        'O jogo contra ' || NEW.adversario || ' precisa de uma escalação!',
        'escalacao_pendente',
        jsonb_build_object('jogo_id', NEW.id, 'data_hora', NEW.data_hora)
    FROM profiles p
    WHERE p.team_id = NEW.time_id 
    AND p.is_admin = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para notificar ao criar jogo (opcional - pode ser feito no app)
-- DROP TRIGGER IF EXISTS trigger_notificar_escalacao_pendente ON jogos;
-- CREATE TRIGGER trigger_notificar_escalacao_pendente
--     AFTER INSERT ON jogos
--     FOR EACH ROW
--     EXECUTE FUNCTION criar_notificacao_escalacao_pendente();

-- 8. Comentários
COMMENT ON TABLE notificacoes_push IS 'Notificações push para usuários';
COMMENT ON TABLE push_tokens IS 'Tokens de dispositivos para push notifications';
