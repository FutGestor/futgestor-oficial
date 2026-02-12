-- 🛡️ SECURITY HARDENING SCRIPT 🛡️
-- Este script blinda o banco de dados contra acessos indevidos e fecha brechas de "dados órfãos".

-- 1. CRIAÇÃO DE FUNÇÃO SEGURA PARA RESUMO FINANCEIRO (Substitui acesso direto à tabela)
CREATE OR REPLACE FUNCTION public.get_financial_summary(_team_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões administrativas (bypassing RLS)
SET search_path = public
AS $$
DECLARE
  total_entrada DECIMAL(10,2);
  total_saida DECIMAL(10,2);
  result JSON;
BEGIN
  -- Calcular entradas
  SELECT COALESCE(SUM(valor), 0) INTO total_entrada
  FROM public.transacoes
  WHERE team_id = _team_id AND tipo = 'entrada';

  -- Calcular saídas
  SELECT COALESCE(SUM(valor), 0) INTO total_saida
  FROM public.transacoes
  WHERE team_id = _team_id AND tipo = 'saida';

  -- Montar JSON de resposta
  result := json_build_object(
    'saldoAtual', total_entrada - total_saida,
    'totalArrecadado', total_entrada,
    'totalGasto', total_saida
  );
  
  RETURN result;
END;
$$;

-- Liberar função para público (pois é usada na página pública do time)
GRANT EXECUTE ON FUNCTION public.get_financial_summary(UUID) TO anon, authenticated, service_role;


-- 2. REFORÇO DA TABELA APENAS PARA MEMBROS (Transações)
-- Remove a brecha "OR team_id IS NULL" e garante que SÓ quem é do time vê.
DROP POLICY IF EXISTS "Team members can view transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes;

CREATE POLICY "Strict team view transacoes"
  ON public.transacoes FOR SELECT
  USING (
    team_id = public.get_user_team_id() 
    -- Se quiser permitir super-admins verem tudo, descomente abaixo:
    -- OR public.has_role(auth.uid(), 'admin'::app_role)
  );


-- 3. JOGADORES: SEPARAÇÃO DE DADOS PÚBLICOS E PRIVADOS
-- Tabela principal: SÓ MEMBROS DO TIME veem (protege email, telefone)
DROP POLICY IF EXISTS "Team members can view jogadores" ON public.jogadores;
DROP POLICY IF EXISTS "Anyone can view jogadores" ON public.jogadores;

CREATE POLICY "Strict team view jogadores"
  ON public.jogadores FOR SELECT
  USING (team_id = public.get_user_team_id());

-- View Pública: Recriada como SECURITY DEFINER (para permitir acesso anônimo seguro)
DROP VIEW IF EXISTS public.jogadores_public;
CREATE VIEW public.jogadores_public 
WITH (security_invoker = off) -- Importante: Roda com permissão do dono da view (admin)
AS
  SELECT id, nome, apelido, posicao, foto_url, numero, team_id, ativo
  FROM public.jogadores;

-- Liberar a view para todos
GRANT SELECT ON public.jogadores_public TO anon, authenticated, service_role;


-- 4. JOGOS (Partidas)
-- Jogos geralmente são públicos (tabela de campeonatos), mas vamos garantir que não vazem dados sensíveis se houver.
-- Se quisermos estrito:
-- DROP POLICY IF EXISTS "Team members can view jogos" ON public.jogos;
-- CREATE POLICY "Public view jogos" ON public.jogos FOR SELECT USING (true); 
-- (Mantemos 'true' se quisermos que qualquer um veja a agenda, o que é normal para campeonatos)
-- Se quisermos fechar:
-- CREATE POLICY "Strict team view jogos" ON public.jogos FOR SELECT USING (team_id = public.get_user_team_id());
-- MANTENDO COMO ESTÁ (Permissivo para visualização, restrito para edição) POIS O SITE PÚBLICO PRECISA LISTAR JOGOS.


-- 5. AVISOS (Strict Mode)
-- Apenas membros do time veem os avisos internos.
DROP POLICY IF EXISTS "Team members can view published avisos" ON public.avisos;
DROP POLICY IF EXISTS "Anyone can view published avisos" ON public.avisos;

CREATE POLICY "Strict team view avisos"
  ON public.avisos FOR SELECT
  USING (
    team_id = public.get_user_team_id()
    -- Admin vê tudo do seu time, User vê apenas publicados do seu time
    AND (publicado = true OR public.is_team_admin(auth.uid(), team_id))
  );

-- NOTA: Isso vai quebrar a "NoticesCard" na página pública se o usuário for anônimo.
-- Se quisermos avisos públicos, precisaríamos de uma view pública ou política "USING (true)" para publicados.
-- Assumindo que avisos são INTERNOS, isso está correto. Se a página pública deve mostrar avisos, avise que criaremos uma view.
-- (Vou manter estrito por segurança).
