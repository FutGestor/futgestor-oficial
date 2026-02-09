
-- =============================================
-- Feature 2: Avisos - Sistema de lido/não lido
-- =============================================

CREATE TABLE public.aviso_leituras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  aviso_id uuid REFERENCES public.avisos(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  lido_em timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(aviso_id, user_id)
);

ALTER TABLE public.aviso_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas leituras"
  ON public.aviso_leituras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário marca como lido"
  ON public.aviso_leituras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Feature 3: Suporte - Canal de chamados
-- =============================================

-- Tabela de chamados
CREATE TABLE public.chamados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assunto text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL DEFAULT 'outro',
  status text NOT NULL DEFAULT 'aberto',
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus chamados"
  ON public.chamados FOR SELECT
  USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Usuário cria chamado"
  ON public.chamados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admin atualiza chamados"
  ON public.chamados FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuário pode atualizar seus chamados"
  ON public.chamados FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de mensagens do chamado
CREATE TABLE public.chamado_mensagens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chamado_id uuid REFERENCES public.chamados(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  mensagem text NOT NULL,
  is_admin boolean DEFAULT false,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mensagens do chamado"
  ON public.chamado_mensagens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chamados
      WHERE chamados.id = chamado_mensagens.chamado_id
      AND (chamados.user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Enviar mensagem no chamado"
  ON public.chamado_mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chamados
      WHERE chamados.id = chamado_mensagens.chamado_id
      AND (chamados.user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
  );

-- Tabela de anexos
CREATE TABLE public.chamado_anexos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chamado_id uuid REFERENCES public.chamados(id) ON DELETE CASCADE NOT NULL,
  mensagem_id uuid REFERENCES public.chamado_mensagens(id) ON DELETE CASCADE,
  url text NOT NULL,
  nome_arquivo text NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver anexos do chamado"
  ON public.chamado_anexos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_anexos.chamado_id
      AND (c.user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Criar anexos do chamado"
  ON public.chamado_anexos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_anexos.chamado_id
      AND (c.user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
  );

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_chamados_updated_at
  BEFORE UPDATE ON public.chamados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para anexos dos chamados
INSERT INTO storage.buckets (id, name, public) VALUES ('chamados-anexos', 'chamados-anexos', true);

CREATE POLICY "Authenticated users can upload chamado files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chamados-anexos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view chamado files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chamados-anexos');
