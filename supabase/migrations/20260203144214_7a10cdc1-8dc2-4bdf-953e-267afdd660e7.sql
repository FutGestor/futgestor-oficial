-- Atualizar políticas RLS para confirmacoes_presenca

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Anyone can insert their own confirmacao" ON confirmacoes_presenca;
DROP POLICY IF EXISTS "Anyone can update confirmacoes" ON confirmacoes_presenca;

-- Política de INSERT: apenas jogadores aprovados podem inserir sua própria confirmação ou admin
CREATE POLICY "Approved users can insert own confirmacao"
ON confirmacoes_presenca
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin pode inserir qualquer confirmação
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Jogador aprovado pode inserir apenas sua própria confirmação
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.aprovado = true
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  )
);

-- Política de UPDATE: apenas o próprio jogador ou admin pode atualizar
CREATE POLICY "Users can update own confirmacao or admin"
ON confirmacoes_presenca
FOR UPDATE
TO authenticated
USING (
  -- Admin pode atualizar qualquer confirmação
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Jogador pode atualizar apenas sua própria confirmação
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.jogador_id = confirmacoes_presenca.jogador_id
    )
  )
);