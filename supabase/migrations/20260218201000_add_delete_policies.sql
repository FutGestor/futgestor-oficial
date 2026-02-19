-- Políticas RLS para permitir God Admin deletar dados

-- Permitir God Admin deletar de profiles
DROP POLICY IF EXISTS "God Admin can delete any profile" ON profiles;
CREATE POLICY "God Admin can delete any profile"
ON profiles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);

-- Permitir God Admin deletar de jogadores
DROP POLICY IF EXISTS "God Admin can delete any jogador" ON jogadores;
CREATE POLICY "God Admin can delete any jogador"
ON jogadores FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);

-- Permitir God Admin deletar de user_roles
DROP POLICY IF EXISTS "God Admin can delete any role" ON user_roles;
CREATE POLICY "God Admin can delete any role"
ON user_roles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);

-- Permitir God Admin deletar de chamados
DROP POLICY IF EXISTS "God Admin can delete any chamado" ON chamados;
CREATE POLICY "God Admin can delete any chamado"
ON chamados FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);

-- Permitir God Admin deletar de chamado_mensagens
DROP POLICY IF EXISTS "God Admin can delete any mensagem" ON chamado_mensagens;
CREATE POLICY "God Admin can delete any mensagem"
ON chamado_mensagens FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);

-- Permitir God Admin deletar de aviso_leituras
DROP POLICY IF EXISTS "God Admin can delete any leitura" ON aviso_leituras;
CREATE POLICY "God Admin can delete any leitura"
ON aviso_leituras FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'futgestor@gmail.com'
    )
);
