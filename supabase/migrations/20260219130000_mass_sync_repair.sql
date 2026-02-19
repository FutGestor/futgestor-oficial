-- Migration to MASS SYNC data from 'teams' (Source of Truth) to 'times' (Projection)
-- This repairs any 'Official' (is_casa=true) records that are empty/stale.
-- FIXED: Removed columns 'cidade' and 'estado' which might not exist on 'times' table in production.

DO $$
DECLARE
    r_team RECORD;
    v_time_id UUID;
    v_inserted_count INTEGER := 0;
    v_updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting Mass Sync Repair (Teams -> Times)...';

    -- Loop through every Team in the system
    -- ensuring existence and correctness of their 'Official' Time record
    FOR r_team IN SELECT * FROM public.teams LOOP
        
        -- 1. Try to find existing Official Time Record
        SELECT id INTO v_time_id
        FROM public.times
        WHERE team_id = r_team.id AND is_casa = true
        LIMIT 1;

        IF v_time_id IS NULL THEN
            -- INSERT missing record
            INSERT INTO public.times (team_id, nome, escudo_url, is_casa)
            VALUES (
                r_team.id, 
                r_team.nome, 
                r_team.escudo_url, 
                true
            );
            v_inserted_count := v_inserted_count + 1;
        ELSE
            -- UPDATE existing record to match Source of Truth
            -- Use IS DISTINCT FROM to only update if changed
            UPDATE public.times
            SET 
                nome = r_team.nome,
                escudo_url = r_team.escudo_url,
                updated_at = now()
            WHERE id = v_time_id
            AND (
                nome IS DISTINCT FROM r_team.nome OR
                escudo_url IS DISTINCT FROM r_team.escudo_url
            );
            
            IF FOUND THEN
                v_updated_count := v_updated_count + 1;
            END IF;
        END IF;

    END LOOP;

    RAISE NOTICE 'Repair Complete. Inserted: %, Updated: %', v_inserted_count, v_updated_count;
END $$;
