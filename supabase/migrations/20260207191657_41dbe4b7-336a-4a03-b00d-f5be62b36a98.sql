ALTER TABLE public.resultados 
ADD COLUMN mvp_jogador_id uuid REFERENCES public.jogadores(id) ON DELETE SET NULL;