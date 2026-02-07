-- Criar tabela de times
CREATE TABLE public.times (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  apelido text,
  escudo_url text,
  cores_principais text,
  cidade text,
  is_casa boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver times ativos
CREATE POLICY "Anyone can view active times"
ON public.times FOR SELECT
USING (ativo = true OR has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage times"
ON public.times FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_times_updated_at
  BEFORE UPDATE ON public.times
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar referencia na tabela jogos
ALTER TABLE public.jogos 
ADD COLUMN time_adversario_id uuid REFERENCES public.times(id);

-- Criar storage bucket para escudos
INSERT INTO storage.buckets (id, name, public)
VALUES ('times', 'times', true);

-- Politica de storage para admins
CREATE POLICY "Admins can manage team badges"
ON storage.objects FOR ALL
USING (bucket_id = 'times' AND has_role(auth.uid(), 'admin'::app_role));

-- Politica de leitura publica
CREATE POLICY "Anyone can view team badges"
ON storage.objects FOR SELECT
USING (bucket_id = 'times');