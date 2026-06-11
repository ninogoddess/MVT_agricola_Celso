-- Tabla para registro de auditoría de pagos (Mercado Pago)
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- Ej: initiated, approved, rejected, webhook_received, validation_error
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_tenant ON payment_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON payment_logs(event_type);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment logs visibles para miembros del tenant" 
ON payment_logs FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
));
