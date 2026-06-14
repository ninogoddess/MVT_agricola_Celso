-- ============================================================================
-- Módulo "Negocios": Bitácora de campo + Finanzas (gastos/ingresos)
-- ============================================================================

-- ── Cuaderno de campo / bitácora de labores ──
CREATE TABLE IF NOT EXISTS field_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parcela_id UUID NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
  cultivo_id UUID REFERENCES cultivos(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  category VARCHAR(40) NOT NULL
    CHECK (category IN ('siembra','cosecha','riego','fertilizacion','poda','fitosanitario','labor','observacion','otro')),
  title VARCHAR(160) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_logs_tenant ON field_logs(tenant_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_field_logs_parcela ON field_logs(parcela_id, log_date DESC);

-- ── Finanzas: gastos e ingresos por parcela/cultivo ──
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parcela_id UUID NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
  cultivo_id UUID REFERENCES cultivos(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  category VARCHAR(40) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description VARCHAR(200),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_parcela ON transactions(parcela_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cultivo ON transactions(cultivo_id);

-- ── RLS ──
ALTER TABLE field_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY field_logs_select ON field_logs FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY field_logs_insert ON field_logs FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY field_logs_update ON field_logs FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY field_logs_delete ON field_logs FOR DELETE USING (tenant_id = public.get_tenant_id());

CREATE POLICY transactions_select ON transactions FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY transactions_update ON transactions FOR UPDATE USING (tenant_id = public.get_tenant_id()) WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY transactions_delete ON transactions FOR DELETE USING (tenant_id = public.get_tenant_id());
