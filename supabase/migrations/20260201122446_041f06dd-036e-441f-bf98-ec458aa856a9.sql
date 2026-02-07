-- Adicionar coluna modalidade na tabela escalacoes
ALTER TABLE public.escalacoes 
ADD COLUMN modalidade text DEFAULT 'society-6' 
CHECK (modalidade IN ('society-5', 'society-6', 'society-7', 'campo-11'));