-- CORREÇÃO: Security Definer View (cotas_public)
-- Cole no SQL Editor do Supabase e clique Run
-- Docs: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- 1) Recria a view com SECURITY INVOKER (respeita RLS do usuário que consulta)
DROP VIEW IF EXISTS public.cotas_public;

CREATE VIEW public.cotas_public
WITH (security_invoker = on)
AS
SELECT cota, numero1, numero2, numero3, identificador, status, pagamento
FROM public.cotas;

-- 2) Policy de leitura para anon (necessária com security_invoker)
DROP POLICY IF EXISTS cotas_public_select ON public.cotas;
CREATE POLICY cotas_public_select ON public.cotas
  FOR SELECT TO anon
  USING (true);

-- 3) Anon só vê colunas públicas (sem comprador / whatsapp)
REVOKE SELECT ON TABLE public.cotas FROM anon;
GRANT SELECT (cota, numero1, numero2, numero3, identificador, status, pagamento)
  ON TABLE public.cotas TO anon;

GRANT SELECT ON TABLE public.cotas_public TO anon, authenticated;

-- 4) Recarrega o schema da API
NOTIFY pgrst, 'reload schema';
