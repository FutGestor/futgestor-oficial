-- Restauração IDEMPOTENTE: Recria tabela notificacoes, função notify_team e políticas RLS
-- Seguro para rodar mesmo que algumas partes já existam

-- 1. Criar tabela (se não existir)
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'geral',
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL DEFAULT '',
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_team_id ON notificacoes(team_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(user_id, lida);

-- 3. Habilitar RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (remove antes de criar para evitar conflito)
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON notificacoes;

CREATE POLICY "Users can view own notifications"
  ON notificacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notificacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated"
  ON notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Habilitar Realtime (ignora erro se já estiver adicionada)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 6. Função notify_team: Insere notificação para TODOS os membros de um time
CREATE OR REPLACE FUNCTION notify_team(
  p_team_id UUID,
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notificacoes (user_id, team_id, tipo, titulo, mensagem, link)
  SELECT p.id, p_team_id, p_tipo, p_titulo, p_mensagem, p_link
  FROM profiles p
  WHERE p.team_id = p_team_id;
END;
$$;
