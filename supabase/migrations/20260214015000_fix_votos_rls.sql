-- Migration para corrigir RLS da tabela votos_destaque
ALTER TABLE public.votos_destaque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select para todos" ON public.votos_destaque;
DROP POLICY IF EXISTS "Permitir insert para autenticados" ON public.votos_destaque;
DROP POLICY IF EXISTS "Permitir update para o dono" ON public.votos_destaque;

CREATE POLICY "Permitir select para todos" ON public.votos_destaque FOR SELECT USING (true);
CREATE POLICY "Permitir insert para autenticados" ON public.votos_destaque FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir update para o dono" ON public.votos_destaque FOR UPDATE USING (auth.uid() = votante_id);

COMMENT ON TABLE public.votos_destaque IS 'Permite votação pública do craque da galera';
