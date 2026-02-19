-- Fix: Remover referências à coluna 'estado' que não existe na tabela teams

CREATE OR REPLACE FUNCTION public.accept_game_invite(
  p_solicitacao_id UUID,
  p_data_hora TIMESTAMP WITH TIME ZONE,
  p_local TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solicitacao RECORD;
  v_team_a_data RECORD; -- Inviter
  v_team_b_data RECORD; -- Acceptor
  v_time_a_ref UUID; -- ID in 'times' for Team A (is_casa=true)
  v_time_b_ref UUID; -- ID in 'times' for Team B (is_casa=true)
  v_game_id_a UUID;
  v_game_id_b UUID;
BEGIN
  -- 1. Get Solicitation
  SELECT * INTO v_solicitacao 
  FROM public.solicitacoes_jogo 
  WHERE id = p_solicitacao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  -- 2. Identify Teams
  -- Team A = Solicite (Inviter)
  -- Team B = Team ID in solicitation (Receiver/Acceptor)
  
  -- 3. Sync Logic for Team B (Acceptor - Guaranteed to exist on platform)
  SELECT * INTO v_team_b_data FROM public.teams WHERE id = v_solicitacao.team_id;
  
  -- Try to update existing is_casa=true record only if it exists
  UPDATE public.times 
  SET 
    nome = v_team_b_data.nome,
    escudo_url = v_team_b_data.escudo_url,
    cidade = v_team_b_data.cidade,
    updated_at = now()
  WHERE team_id = v_solicitacao.team_id AND is_casa = true
  RETURNING id INTO v_time_b_ref;

  -- If not found, insert
  IF v_time_b_ref IS NULL THEN
    INSERT INTO public.times (team_id, nome, escudo_url, cidade, is_casa)
    VALUES (
      v_solicitacao.team_id,
      v_team_b_data.nome,
      v_team_b_data.escudo_url,
      v_team_b_data.cidade,
      true
    )
    RETURNING id INTO v_time_b_ref;
  END IF;

  -- 4. Sync Logic for Team A (Inviter - Might be null if external)
  IF v_solicitacao.time_solicitante_id IS NOT NULL THEN
     SELECT * INTO v_team_a_data FROM public.teams WHERE id = v_solicitacao.time_solicitante_id;
     
     -- Try to update existing is_casa=true record
     UPDATE public.times 
     SET 
        nome = v_team_a_data.nome,
        escudo_url = v_team_a_data.escudo_url,
        cidade = v_team_a_data.cidade,
        updated_at = now()
     WHERE team_id = v_solicitacao.time_solicitante_id AND is_casa = true
     RETURNING id INTO v_time_a_ref;

     -- If not found, insert
     IF v_time_a_ref IS NULL THEN
        INSERT INTO public.times (team_id, nome, escudo_url, cidade, is_casa)
        VALUES (
          v_solicitacao.time_solicitante_id,
          v_team_a_data.nome,
          v_team_a_data.escudo_url,
          v_team_a_data.cidade,
          true
        )
        RETURNING id INTO v_time_a_ref;
     END IF;
  END IF;

  -- 5. Insert Game for Team B (Acceptor)
  -- Links to Team A's ref (if exists)
  INSERT INTO public.jogos (
    team_id,
    data_hora,
    local,
    adversario,
    status,
    observacoes,
    time_adversario_id
  ) VALUES (
    v_solicitacao.team_id,
    p_data_hora,
    p_local,
    v_solicitacao.nome_time, -- Name of Team A (Inviter)
    'agendado',
    COALESCE(v_solicitacao.observacoes, 'Partida agendada via convite.'),
    v_time_a_ref -- Can be null
  );

  -- 6. Insert Game for Team A (Inviter) - Only if on platform
  IF v_solicitacao.time_solicitante_id IS NOT NULL AND v_time_b_ref IS NOT NULL THEN
    INSERT INTO public.jogos (
      team_id,
      data_hora,
      local,
      adversario,
      status,
      observacoes,
      time_adversario_id
    ) VALUES (
      v_solicitacao.time_solicitante_id,
      p_data_hora,
      p_local,
      v_team_b_data.nome, -- Name of Team B
      'agendado',
      'Partida agendada via convite aceito.',
      v_time_b_ref -- Links to B's official record
    );
  END IF;

  -- 7. Update Solicitation Status
  UPDATE public.solicitacoes_jogo
  SET status = 'aceita', updated_at = now()
  WHERE id = p_solicitacao_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_game_invite TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_game_invite TO service_role;
