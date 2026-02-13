-- 1. Tabela: votacao_craque
CREATE TABLE IF NOT EXISTS public.votacao_craque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jogo_id UUID NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
    jogador_id UUID NOT NULL REFERENCES public.jogadores(id) ON DELETE CASCADE,
    device_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.votacao_craque ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Leitura pública
DROP POLICY IF EXISTS "Leitura pública de votos" ON public.votacao_craque;
CREATE POLICY "Leitura pública de votos" ON public.votacao_craque
    FOR SELECT
    USING (true);

-- 4. View: view_craque_jogo
CREATE OR REPLACE VIEW public.view_craque_jogo AS
SELECT
    jogo_id,
    jogador_id,
    COUNT(*) as votos
FROM
    public.votacao_craque
GROUP BY
    jogo_id,
    jogador_id;

-- 5. Função RPC: votar_craque
CREATE OR REPLACE FUNCTION public.votar_craque(
    p_jogo_id UUID,
    p_jogador_id UUID,
    p_device_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se já votou nesse jogo
    SELECT COUNT(*) INTO v_count
    FROM public.votacao_craque
    WHERE jogo_id = p_jogo_id AND device_hash = p_device_hash;

    IF v_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Você já votou neste jogo.');
    END IF;

    INSERT INTO public.votacao_craque (jogo_id, jogador_id, device_hash)
    VALUES (p_jogo_id, p_jogador_id, p_device_hash);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Permissões (Crucial!)
GRANT ALL ON public.votacao_craque TO anon, authenticated, service_role;
GRANT ALL ON public.view_craque_jogo TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.votar_craque(uuid, uuid, text) TO anon, authenticated, service_role;
