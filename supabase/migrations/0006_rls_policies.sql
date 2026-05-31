-- Helper: función que extrae el tenant_id del usuario autenticado
-- Se crea en schema public (no tenemos permisos para escribir en auth)
CREATE OR REPLACE FUNCTION public.get_tenant_id() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
$$;

-- Activar RLS en todas las tablas multi-tenant
ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_data     ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders        ENABLE ROW LEVEL SECURITY;

-- === Tenants ===
CREATE POLICY tenant_select ON tenants FOR SELECT USING (id = public.get_tenant_id());

-- === User Profiles ===
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());

-- === Parcelas ===
CREATE POLICY parcelas_select ON parcelas FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY parcelas_insert ON parcelas FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY parcelas_update ON parcelas FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY parcelas_delete ON parcelas FOR DELETE USING (tenant_id = public.get_tenant_id());

-- === Cultivos ===
CREATE POLICY cultivos_select ON cultivos FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY cultivos_insert ON cultivos FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY cultivos_update ON cultivos FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY cultivos_delete ON cultivos FOR DELETE USING (tenant_id = public.get_tenant_id());

-- === Climate Data ===
CREATE POLICY climate_data_select ON climate_data FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY climate_data_insert ON climate_data FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

-- === Soil Data ===
CREATE POLICY soil_data_select ON soil_data FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY soil_data_insert ON soil_data FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

-- === Alerts ===
CREATE POLICY alerts_select ON alerts FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY alerts_insert ON alerts FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY alerts_update ON alerts FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());

-- === Alert Thresholds ===
CREATE POLICY thresholds_select ON alert_thresholds FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY thresholds_insert ON alert_thresholds FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY thresholds_update ON alert_thresholds FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY thresholds_delete ON alert_thresholds FOR DELETE USING (tenant_id = public.get_tenant_id());

-- === Recommendations ===
CREATE POLICY recommendations_select ON recommendations FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY recommendations_insert ON recommendations FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY recommendations_update ON recommendations FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());

-- === Reminders ===
CREATE POLICY reminders_select ON reminders FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY reminders_insert ON reminders FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY reminders_update ON reminders FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY reminders_delete ON reminders FOR DELETE USING (tenant_id = public.get_tenant_id());

-- === Crop Parameters (público de lectura) ===
ALTER TABLE crop_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY crop_parameters_public_read ON crop_parameters FOR SELECT USING (TRUE);
