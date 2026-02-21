-- ============================================
-- CORREÇÃO: Permitir acesso público ao invite_code para validação de convites
-- ============================================

-- Verificar se a coluna invite_code existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'invite_code'
    ) THEN
        -- Adicionar coluna invite_code se não existir
        ALTER TABLE public.teams ADD COLUMN invite_code TEXT UNIQUE;
        
        -- Criar índice para busca rápida
        CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON public.teams(invite_code);
    END IF;
END $$;

-- Remover policy existente para evitar conflitos
DROP POLICY IF EXISTS "Public can view teams by invite code" ON public.teams;

-- Criar policy específica para permitir busca por invite_code (anônimo)
CREATE POLICY "Public can view teams by invite code"
  ON public.teams FOR SELECT
  USING (invite_code IS NOT NULL);

-- Garantir que RLS está ativado
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Verificar se a função de geração de código existe
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Gerar código aleatório de 6 caracteres (maiúsculas e números)
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM teams WHERE invite_code = code
        ) INTO exists_check;
        
        -- Se não existe, retornar
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;

-- Atualizar times existentes que não têm código
UPDATE public.teams 
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;

-- Comentário
COMMENT ON COLUMN public.teams.invite_code IS 'Código de convite único para o time. Público para permitir validação de convites.';
