-- Derrubar a função antiga para garantir que não haja conflitos de assinatura
DROP FUNCTION IF EXISTS public.votar_craque(uuid, uuid, text);

-- Recriar a função
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

-- Conceder permissões (AGORA VAI!)
GRANT EXECUTE ON FUNCTION public.votar_craque(uuid, uuid, text) TO anon, authenticated, service_role;
GRANT SELECT ON public.votacao_craque TO anon, authenticated, service_role;
GRANT INSERT ON public.votacao_craque TO anon, authenticated, service_role;
GRANT SELECT ON public.view_craque_jogo TO anon, authenticated, service_role;
