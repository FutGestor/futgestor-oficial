-- Permitir que usuarios aprovados facam upload de fotos no bucket jogadores
CREATE POLICY "Users can upload own photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'jogadores' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND aprovado = true
  )
);

-- Permitir que usuarios atualizem suas proprias fotos
CREATE POLICY "Users can update own photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'jogadores'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND aprovado = true
  )
);

-- Permitir que usuarios deletem suas proprias fotos
CREATE POLICY "Users can delete own photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'jogadores'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND aprovado = true
  )
);