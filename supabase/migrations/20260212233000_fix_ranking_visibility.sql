-- Correção de Permissões para Ranking Público

-- 1. Garantir acesso de leitura para ANON em jogadores (necessário para o join)
DROP POLICY IF EXISTS "Leitura pública de jogadores" ON public.jogadores;
CREATE POLICY "Leitura pública de jogadores" ON public.jogadores
    FOR SELECT
    TO anon
    USING (true);

-- 2. Garantir acesso de leitura para ANON em estatisticas_partida
DROP POLICY IF EXISTS "Leitura pública de estatísticas" ON public.estatisticas_partida;
CREATE POLICY "Leitura pública de estatísticas" ON public.estatisticas_partida
    FOR SELECT
    TO anon
    USING (true);

-- 3. Garantir acesso de leitura para ANON em resultados (usado no ranking destaques)
DROP POLICY IF EXISTS "Leitura pública de resultados" ON public.resultados;
CREATE POLICY "Leitura pública de resultados" ON public.resultados
    FOR SELECT
    TO anon
    USING (true);

-- 4. Backfill de team_id em estatisticas_partida (para dados antigos aparecerem no ranking filtrado)
-- Atualiza estatisticas_partida baseando-se no team_id da tabela resultados
DO $$
BEGIN
    -- Verifica se a coluna team_id existe antes de tentar atualizar
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estatisticas_partida' AND column_name = 'team_id') THEN
        UPDATE public.estatisticas_partida ep
        SET team_id = r.team_id
        FROM public.resultados r
        WHERE ep.resultado_id = r.id
        AND ep.team_id IS NULL;
    END IF;
END $$;
