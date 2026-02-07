-- Criar tabela profiles para vincular usuarios a jogadores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  jogador_id UUID REFERENCES public.jogadores(id) ON DELETE SET NULL,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna user_id na tabela jogadores
ALTER TABLE public.jogadores ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Politica para jogadores: usuario pode editar seu proprio jogador
CREATE POLICY "Users can update own jogador"
ON public.jogadores FOR UPDATE
USING (
  user_id = auth.uid() OR 
  id IN (SELECT jogador_id FROM public.profiles WHERE id = auth.uid())
);

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar funcao para criar profile automaticamente apos signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, aprovado)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();