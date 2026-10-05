-- CORREÇÃO dos warnings de segurança do Advisors
-- Cole no SQL Editor do Supabase e clique Run

-- ═══════════════════════════════════════════════════════════
-- 1) search_path em gerar_identificador (+ não expor via API)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.gerar_identificador()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  id TEXT;
  n INT;
  i INT;
BEGIN
  FOR n IN 1..50 LOOP
    id := 'RF-';
    FOR i IN 1..6 LOOP
      id := id || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM cotas WHERE identificador = id) THEN
      RETURN id;
    END IF;
  END LOOP;
  RETURN 'RF-' || upper(substr(md5(random()::text), 1, 6));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.gerar_identificador() FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 2) Revogar EXECUTE de anon nas funções admin
--    (Postgres concede EXECUTE a PUBLIC por padrão)
-- ═══════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.admin_bulk_status(TEXT[], TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_cotas() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_all() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_pagamento(TEXT) FROM PUBLIC, anon;

-- reservar_cota: pública de propósito (comprador sem login)
REVOKE EXECUTE ON FUNCTION public.reservar_cota(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reservar_cota(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Reaplicar grants admin só para authenticated
GRANT EXECUTE ON FUNCTION public.admin_bulk_status(TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_cotas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_all() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_pagamento(TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- 3) Policies menos "USING (true)" — exige usuário logado
--    (mesmo efeito prático: só authenticated acessa o painel)
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS cotas_admin_all ON public.cotas;
CREATE POLICY cotas_admin_all ON public.cotas
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS rifa_config_admin_update ON public.rifa_config;
CREATE POLICY rifa_config_admin_update ON public.rifa_config
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

NOTIFY pgrst, 'reload schema';
