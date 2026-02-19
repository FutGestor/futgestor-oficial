-- Cleanup: Remover tabela e funções de notificações (reversão completa)

-- Remover políticas
DROP POLICY IF EXISTS "Allow select for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Allow update for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON notificacoes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;
DROP POLICY IF EXISTS "System can insert notifications" ON notificacoes;
DROP POLICY IF EXISTS "Enable select for users" ON notificacoes;
DROP POLICY IF EXISTS "Enable update for users" ON notificacoes;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON notificacoes;

-- Remover função
DROP FUNCTION IF EXISTS notify_team(UUID, TEXT, TEXT, TEXT, TEXT);

-- Remover tabela (desabilitar RLS primeiro)
ALTER TABLE IF EXISTS notificacoes DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS notificacoes;
