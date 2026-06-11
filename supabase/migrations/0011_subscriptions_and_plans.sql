-- Crear función genérica para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla plans
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_clp INTEGER NOT NULL,
  max_plots INTEGER NOT NULL,
  max_crops INTEGER NOT NULL,
  max_reminders INTEGER NOT NULL,
  allow_workers BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar planes iniciales
INSERT INTO plans (id, name, price_clp, max_plots, max_crops, max_reminders, allow_workers) VALUES
('free', 'Gratis', 0, 1, 3, 6, false),
('pro', 'Pro', 2990, 10, 100, 100, false),
('organizacion', 'Organización', 9990, 100, 1000, 1000, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_clp = EXCLUDED.price_clp,
  max_plots = EXCLUDED.max_plots,
  max_crops = EXCLUDED.max_crops,
  max_reminders = EXCLUDED.max_reminders,
  allow_workers = EXCLUDED.allow_workers;

-- Tabla subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politicas plans (Lectura pública para autenticados)
DROP POLICY IF EXISTS "Plans son visibles para todos los usuarios autenticados" ON plans;
CREATE POLICY "Plans son visibles para todos los usuarios autenticados" 
ON plans FOR SELECT 
TO authenticated 
USING (true);

-- Politicas subscriptions (Solo lectura para miembros del tenant)
DROP POLICY IF EXISTS "Suscripciones visibles para miembros del tenant" ON subscriptions;
CREATE POLICY "Suscripciones visibles para miembros del tenant" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
));

-- Trigger para updated_at en subscriptions
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
