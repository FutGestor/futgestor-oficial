-- Enum para roles de usuário (admin)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para posições de jogadores
CREATE TYPE public.player_position AS ENUM ('goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante');

-- Enum para status de jogo
CREATE TYPE public.game_status AS ENUM ('agendado', 'confirmado', 'em_andamento', 'finalizado', 'cancelado');

-- Enum para tipo de transação
CREATE TYPE public.transaction_type AS ENUM ('entrada', 'saida');

-- Enum para categoria de aviso
CREATE TYPE public.notice_category AS ENUM ('geral', 'urgente', 'financeiro', 'jogo');

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela de jogadores
CREATE TABLE public.jogadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  apelido TEXT,
  posicao player_position NOT NULL,
  numero INTEGER,
  foto_url TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de jogos (agenda)
CREATE TABLE public.jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT NOT NULL,
  adversario TEXT NOT NULL,
  status game_status DEFAULT 'agendado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados
CREATE TABLE public.resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID REFERENCES public.jogos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gols_favor INTEGER NOT NULL DEFAULT 0,
  gols_contra INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de transações financeiras
CREATE TABLE public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo transaction_type NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de escalações
CREATE TABLE public.escalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID REFERENCES public.jogos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  formacao TEXT DEFAULT '4-3-3',
  publicada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de jogadores na escalação
CREATE TABLE public.escalacao_jogadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalacao_id UUID REFERENCES public.escalacoes(id) ON DELETE CASCADE NOT NULL,
  jogador_id UUID REFERENCES public.jogadores(id) ON DELETE CASCADE NOT NULL,
  posicao_campo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(escalacao_id, jogador_id)
);

-- Tabela de avisos
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria notice_category DEFAULT 'geral',
  publicado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_jogadores_updated_at
  BEFORE UPDATE ON public.jogadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jogos_updated_at
  BEFORE UPDATE ON public.jogos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resultados_updated_at
  BEFORE UPDATE ON public.resultados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transacoes_updated_at
  BEFORE UPDATE ON public.transacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalacoes_updated_at
  BEFORE UPDATE ON public.escalacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avisos_updated_at
  BEFORE UPDATE ON public.avisos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacao_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles (apenas leitura própria, admin gerencia)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para jogadores (todos podem ver, admin gerencia)
CREATE POLICY "Anyone can view jogadores" ON public.jogadores
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage jogadores" ON public.jogadores
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para jogos (todos podem ver, admin gerencia)
CREATE POLICY "Anyone can view jogos" ON public.jogos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage jogos" ON public.jogos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para resultados (todos podem ver, admin gerencia)
CREATE POLICY "Anyone can view resultados" ON public.resultados
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage resultados" ON public.resultados
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para transações (todos podem ver, admin gerencia)
CREATE POLICY "Anyone can view transacoes" ON public.transacoes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage transacoes" ON public.transacoes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para escalações (todos podem ver publicadas, admin gerencia)
CREATE POLICY "Anyone can view published escalacoes" ON public.escalacoes
  FOR SELECT USING (publicada = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage escalacoes" ON public.escalacoes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para escalacao_jogadores
CREATE POLICY "Anyone can view escalacao_jogadores" ON public.escalacao_jogadores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.escalacoes e 
      WHERE e.id = escalacao_id 
      AND (e.publicada = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage escalacao_jogadores" ON public.escalacao_jogadores
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para avisos (todos podem ver publicados, admin gerencia)
CREATE POLICY "Anyone can view published avisos" ON public.avisos
  FOR SELECT USING (publicado = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage avisos" ON public.avisos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Criar bucket de storage para fotos de jogadores
INSERT INTO storage.buckets (id, name, public) VALUES ('jogadores', 'jogadores', true);

-- Políticas de storage para fotos de jogadores
CREATE POLICY "Anyone can view jogadores photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'jogadores');

CREATE POLICY "Admins can upload jogadores photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'jogadores' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update jogadores photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'jogadores' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete jogadores photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'jogadores' 
    AND public.has_role(auth.uid(), 'admin')
  );
