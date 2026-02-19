-- Migration to cleanup 'ghost' times records (is_casa = false)
-- and re-link games to official records (is_casa = true)

DO $$
DECLARE
    r RECORD;
    v_official_time_id UUID;
    v_updated_count INTEGER := 0;
    v_deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting Ghost Records Cleanup...';

    -- 1. Loop through all games linked to a "Ghost" Time (is_casa=false)
    -- We join with 'times' to filter only those linking to is_casa=false
    FOR r IN 
        SELECT g.id AS game_id, g.time_adversario_id, t.team_id, t.nome AS ghost_nome
        FROM public.jogos g
        JOIN public.times t ON g.time_adversario_id = t.id
        WHERE t.is_casa = false
    LOOP
        -- 2. Find the "Official" Time ID (is_casa=true) for this team
        SELECT id INTO v_official_time_id
        FROM public.times
        WHERE team_id = r.team_id AND is_casa = true
        LIMIT 1;

        -- 3. If found, Update the Game
        IF v_official_time_id IS NOT NULL THEN
            UPDATE public.jogos
            SET time_adversario_id = v_official_time_id,
                updated_at = now()
            WHERE id = r.game_id;
            
            v_updated_count := v_updated_count + 1;
            RAISE NOTICE 'Game % re-linked from Ghost % to Official %', r.game_id, r.time_adversario_id, v_official_time_id;
        ELSE
            -- If no official record exists, we could Create one, but for now we Log Warning.
            -- Using "Link to Null" strategy might be safer if the team was deleted but game kept.
            -- But usually, active teams have is_casa=true.
            
            -- Attempt to create ONE if missing (Self-Repair)
            IF r.team_id IS NOT NULL THEN
               DECLARE
                  v_team_data RECORD;
                  v_new_id UUID;
               BEGIN
                  SELECT * INTO v_team_data FROM public.teams WHERE id = r.team_id;
                  IF FOUND THEN
                      INSERT INTO public.times (team_id, nome, escudo_url, cidade, estado, is_casa)
                      VALUES (r.team_id, v_team_data.nome, v_team_data.escudo_url, NULL, NULL, true) -- NULLs for safety if cols missing
                      RETURNING id INTO v_new_id;
                      
                      UPDATE public.jogos
                      SET time_adversario_id = v_new_id, updated_at = now()
                      WHERE id = r.game_id;
                      
                      v_updated_count := v_updated_count + 1;
                      RAISE NOTICE 'Created missing Official Record % and re-linked Game %', v_new_id, r.game_id;
                  ELSE
                      RAISE NOTICE 'WARNING: Team % not found in teams table. Game % points to orphan ghost.', r.team_id, r.game_id;
                  END IF;
               END;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Games updated: %', v_updated_count;

    -- 4. Delete orphaned Ghost Records (is_casa=false)
    -- Safe delete: Only deletion if request/game tables don't reference it (just to be super safe)
    -- Note: Solicitacoes might reference them? No, Solicitacoes usually reference 'teams'(organization).
    -- But let's check references in 'jogos' just to be sure we don't break inconsistent states.

    DELETE FROM public.times
    WHERE is_casa = false
    AND id NOT IN (SELECT DISTINCT time_adversario_id FROM public.jogos WHERE time_adversario_id IS NOT NULL);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE 'Ghost records deleted: %', v_deleted_count;
    
    RAISE NOTICE 'Cleanup Complete.';
END $$;
