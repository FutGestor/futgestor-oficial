-- Allow approved users to insert their own jogador record
CREATE POLICY "Users can insert own jogador"
ON public.jogadores
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND aprovado = true
  )
);