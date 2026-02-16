-- === SISTEMA DE CONQUISTAS (22 CATEGORIAS) ===

-- Passo 1: Adicionar colunas estatísticas em estatisticas_partida se não existirem
ALTER TABLE public.estatisticas_partida ADD COLUMN IF NOT EXISTS defesas_dificeis INTEGER DEFAULT 0;
ALTER TABLE public.estatisticas_partida ADD COLUMN IF NOT EXISTS penaltis_defendidos INTEGER DEFAULT 0;
ALTER TABLE public.estatisticas_partida ADD COLUMN IF NOT EXISTS desarmes INTEGER DEFAULT 0;
ALTER TABLE public.estatisticas_partida ADD COLUMN IF NOT EXISTS gol_decisivo BOOLEAN DEFAULT false;

-- Passo 2: Preparar a tabela achievements
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS applicable_positions TEXT[] DEFAULT '{}';

-- Limpar dados antigos para reinício limpo
DELETE FROM public.player_achievements;
DELETE FROM public.achievements;

-- Passo 3: Inserir as 22 Conquistas
INSERT INTO public.achievements (slug, name, description, icon, category, stat_key, applicable_positions, tiers) VALUES

-- === UNIVERSAIS (aparecem para TODOS) ===
('artilheiro', 'Artilheiro', 'Marque gols pelo time', 'target', 'gols', 'total_gols', '{}',
 '[{"level":"bronze","label":"Artilheiro Iniciante","threshold":5},{"level":"prata","label":"Artilheiro Consistente","threshold":15},{"level":"ouro","label":"Artilheiro Decisivo","threshold":50},{"level":"diamante","label":"Lenda do Gol","threshold":100}]'),

('hat-trick', 'Hat-Trick', 'Marque 3+ gols em uma única partida', 'flame', 'gols', 'total_hat_tricks', '{}',
 '[{"level":"bronze","label":"Primeiro Hat-trick","threshold":1},{"level":"prata","label":"Colecionador","threshold":3},{"level":"ouro","label":"Rei do Hat-trick","threshold":10}]'),

('garcom', 'Garçom', 'Distribua assistências', 'handshake', 'assistencias', 'total_assistencias', '{}',
 '[{"level":"bronze","label":"Passador Iniciante","threshold":3},{"level":"prata","label":"Dono das Assistências","threshold":10},{"level":"ouro","label":"Maestro Supremo","threshold":30},{"level":"diamante","label":"Lenda do Passe","threshold":60}]'),

('presenca', 'Presença', 'Participe de jogos do time', 'calendar', 'jogos', 'total_jogos', '{}',
 '[{"level":"bronze","label":"Cria do Time","threshold":5},{"level":"prata","label":"Titular Absoluto","threshold":20},{"level":"ouro","label":"Veterano","threshold":50},{"level":"diamante","label":"Lenda do Clube","threshold":100}]'),

('estreia', 'Estreia', 'Jogue sua primeira partida oficial', 'medal', 'especial', 'total_jogos', '{}',
 '[{"level":"unica","label":"Estreia no Time","threshold":1}]'),

('centenario', 'Centenário', 'Alcance 100 jogos pelo time', 'crown', 'jogos', 'total_jogos', '{}',
 '[{"level":"unica","label":"Centenário","threshold":100}]'),

('destaque', 'Craque da Galera', 'Seja votado como destaque da partida', 'star', 'especial', 'total_votos_destaque', '{}',
 '[{"level":"bronze","label":"Destaque da Galera","threshold":1},{"level":"prata","label":"MVP Recorrente","threshold":5},{"level":"ouro","label":"Estrela do Time","threshold":15},{"level":"diamante","label":"Ídolo Absoluto","threshold":30}]'),

('vitorioso', 'Vitorioso', 'Acumule vitórias com o time', 'trophy', 'jogos', 'total_vitorias', '{}',
 '[{"level":"bronze","label":"Gosto de Vencer","threshold":5},{"level":"prata","label":"Vencedor Nato","threshold":20},{"level":"ouro","label":"Máquina de Vitórias","threshold":50}]'),

('frequencia', 'Frequência', 'Jogue partidas consecutivas sem faltar', 'repeat', 'jogos', 'max_sequencia_jogos', '{}',
 '[{"level":"bronze","label":"Sempre Presente","threshold":5},{"level":"prata","label":"Imbatível","threshold":10},{"level":"ouro","label":"Ferro de Passar","threshold":20}]'),

('clutch', 'Clutch', 'Marque gol em jogos decisivos', 'zap', 'especial', 'gols_decisivos', '{}',
 '[{"level":"bronze","label":"Jogador de Decisão","threshold":1},{"level":"prata","label":"Homem do Jogo","threshold":5},{"level":"ouro","label":"Senhor das Finais","threshold":15}]'),

-- === GOLEIRO ===
('muralha', 'Muralha', 'Jogos sem sofrer gol', 'shield', 'defesa', 'total_clean_sheets', '{Goleiro}',
 '[{"level":"bronze","label":"Muralha Iniciante","threshold":3},{"level":"prata","label":"Muralha de Ferro","threshold":10},{"level":"ouro","label":"Intransponível","threshold":25},{"level":"diamante","label":"Paredão Lendário","threshold":50}]'),

('maos-de-ouro', 'Mãos de Ouro', 'Realize defesas difíceis', 'hand', 'defesa', 'total_defesas', '{Goleiro}',
 '[{"level":"bronze","label":"Reflexo Rápido","threshold":10},{"level":"prata","label":"Mãos de Ouro","threshold":30},{"level":"ouro","label":"Santo Goleiro","threshold":75}]'),

('pegador-penalti', 'Pegador de Pênalti', 'Defenda pênaltis', 'x-circle', 'defesa', 'total_penaltis_defendidos', '{Goleiro}',
 '[{"level":"bronze","label":"Primeiro Pênalti","threshold":1},{"level":"prata","label":"Especialista","threshold":3},{"level":"ouro","label":"Terror dos Batedores","threshold":8}]'),

-- === ZAGUEIRO / LATERAL / VOLANTE ===
('xerife', 'Xerife', 'Realize desarmes e roubadas de bola', 'shield-check', 'defesa', 'total_desarmes', '{Zagueiro,Lateral,Volante}',
 '[{"level":"bronze","label":"Marcador Iniciante","threshold":10},{"level":"prata","label":"Xerife da Área","threshold":30},{"level":"ouro","label":"Zagueiro de Aço","threshold":75}]'),

('fair-play', 'Fair Play', 'Jogos consecutivos sem cartão', 'heart', 'defesa', 'max_jogos_sem_cartao', '{Zagueiro,Lateral,Volante}',
 '[{"level":"bronze","label":"Jogo Limpo","threshold":5},{"level":"prata","label":"Disciplinado","threshold":15},{"level":"ouro","label":"Fair Play Total","threshold":30}]'),

-- === VOLANTE / MEIA ===
('maestro', 'Maestro', 'Participe de gols (gol + assistência)', 'music', 'meio', 'total_participacoes_gol', '{Volante,Meia}',
 '[{"level":"bronze","label":"Organizador","threshold":5},{"level":"prata","label":"Maestro do Meio","threshold":15},{"level":"ouro","label":"Cérebro do Time","threshold":40}]'),

('dupla-ameaca', 'Dupla Ameaça', 'Gol E assistência na mesma partida', 'swords', 'meio', 'total_dupla_contribuicao', '{Volante,Meia}',
 '[{"level":"bronze","label":"Faz de Tudo","threshold":1},{"level":"prata","label":"Dupla Ameaça","threshold":5},{"level":"ouro","label":"Completo","threshold":15}]'),

-- === ATACANTE / PONTA ===
('instinto', 'Instinto Matador', 'Gol em jogos consecutivos', 'flame', 'ataque', 'max_sequencia_gols', '{Atacante,Ponta}',
 '[{"level":"bronze","label":"Em Chamas","threshold":3},{"level":"prata","label":"Imparável","threshold":5},{"level":"ouro","label":"Máquina de Gols","threshold":10}]'),

('finalizador', 'Finalizador', 'Alta taxa de gols por jogo', 'crosshair', 'ataque', 'media_gols_por_jogo_x100', '{Atacante,Ponta}',
 '[{"level":"bronze","label":"Oportuno","threshold":30},{"level":"prata","label":"Certeiro","threshold":50},{"level":"ouro","label":"Predador da Área","threshold":75}]'),

('goleador', 'Goleador', 'Marque 2+ gols na mesma partida', 'trending-up', 'ataque', 'total_jogos_multi_gol', '{Atacante,Ponta}',
 '[{"level":"bronze","label":"Dobradinha","threshold":3},{"level":"prata","label":"Goleador","threshold":10},{"level":"ouro","label":"Destruidor","threshold":25}]'),

-- === LATERAL ===
('ala-ofensivo', 'Ala Ofensivo', 'Assistências de cruzamento', 'arrow-right-circle', 'lateral', 'total_assistencias', '{Lateral}',
 '[{"level":"bronze","label":"Lateral Ofensivo","threshold":3},{"level":"prata","label":"Ala Imparável","threshold":10},{"level":"ouro","label":"Cafu do Pelado","threshold":25}]'),

('coringa', 'Coringa', 'Atue em mais de uma posição', 'shuffle', 'especial', 'total_posicoes_diferentes', '{Lateral,Volante,Meia}',
 '[{"level":"bronze","label":"Versátil","threshold":2},{"level":"prata","label":"Coringa","threshold":3},{"level":"ouro","label":"Universal","threshold":4}]');


-- Passo 4: Função Robusta para Recalcular Conquistas
CREATE OR REPLACE FUNCTION public.recalculate_achievements(p_jogador_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ach RECORD;
    v_stat_value INTEGER;
    v_tier_level TEXT;
    v_tier_label TEXT;
    v_total_votos INTEGER;
    v_total_vitorias INTEGER;
    v_total_clean_sheets INTEGER;
BEGIN
    -- 1. Buscar estatísticas globais que precisam de JOINs complexos
    
    -- Votos de destaque
    SELECT COUNT(*) INTO v_total_votos
    FROM public.votacao_craque
    WHERE jogador_id = p_jogador_id;

    -- Vitórias e Clean Sheets
    SELECT 
        COUNT(*) FILTER (WHERE r.gols_favor > r.gols_contra) as vitorias,
        COUNT(*) FILTER (WHERE r.gols_contra = 0) as clean_sheets
    INTO v_total_vitorias, v_total_clean_sheets
    FROM public.estatisticas_partida ep
    JOIN public.resultados r ON ep.resultado_id = r.id
    WHERE ep.jogador_id = p_jogador_id AND ep.participou = true;

    -- 2. Loop por todas as conquistas para calcular cada uma
    FOR ach IN SELECT * FROM public.achievements LOOP
        v_stat_value := 0;

        -- Lógica de cálculo baseada na stat_key
        CASE ach.stat_key
            WHEN 'total_gols' THEN
                SELECT SUM(gols) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'total_assistencias' THEN
                SELECT SUM(assistencias) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'total_jogos' THEN
                SELECT COUNT(*) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id AND participou = true;
            WHEN 'total_hat_tricks' THEN
                SELECT COUNT(*) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id AND gols >= 3;
            WHEN 'total_votos_destaque' THEN
                v_stat_value := v_total_votos;
            WHEN 'total_vitorias' THEN
                v_stat_value := v_total_vitorias;
            WHEN 'total_clean_sheets' THEN
                v_stat_value := v_total_clean_sheets;
            WHEN 'total_defesas' THEN
                SELECT SUM(defesas_dificeis) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'total_penaltis_defendidos' THEN
                SELECT SUM(penaltis_defendidos) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'total_desarmes' THEN
                SELECT SUM(desarmes) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'gols_decisivos' THEN
                SELECT COUNT(*) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id AND gol_decisivo = true;
            WHEN 'total_participacoes_gol' THEN
                SELECT SUM(gols + assistencias) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id;
            WHEN 'total_jogos_multi_gol' THEN
                SELECT COUNT(*) INTO v_stat_value FROM public.estatisticas_partida WHERE jogador_id = p_jogador_id AND gols >= 2;
            ELSE
                v_stat_value := 0;
        END CASE;

        v_stat_value := COALESCE(v_stat_value, 0);

        -- 3. Identificar o Tier atingido
        v_tier_level := NULL;
        v_tier_label := NULL;

        SELECT tier_info->>'level', tier_info->>'label'
        INTO v_tier_level, v_tier_label
        FROM jsonb_array_elements(ach.tiers) AS tier_info
        WHERE (tier_info->>'threshold')::int <= v_stat_value
        ORDER BY (tier_info->>'threshold')::int DESC
        LIMIT 1;

        -- 4. Atualizar a tabela player_achievements
        IF v_tier_level IS NOT NULL THEN
            INSERT INTO public.player_achievements (jogador_id, achievement_id, current_tier, current_value, unlocked_at)
            VALUES (p_jogador_id, ach.id, v_tier_level, v_stat_value, NOW())
            ON CONFLICT (jogador_id, achievement_id) 
            DO UPDATE SET 
                current_tier = EXCLUDED.current_tier,
                current_value = EXCLUDED.current_value,
                unlocked_at = CASE 
                    WHEN player_achievements.current_tier IS DISTINCT FROM EXCLUDED.current_tier THEN NOW() 
                    ELSE player_achievements.unlocked_at 
                END;
        END IF;
    END LOOP;
END;
$$;

-- Passo 5: Recalcular para todos os jogadores
DO $$
DECLARE
  jog RECORD;
BEGIN
  FOR jog IN SELECT id FROM public.jogadores LOOP
    PERFORM public.recalculate_achievements(jog.id);
  END LOOP;
END $$;

-- Passo 6: Permissões
GRANT ALL ON public.achievements TO anon, authenticated, service_role;
GRANT ALL ON public.player_achievements TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_achievements(UUID) TO anon, authenticated, service_role;
