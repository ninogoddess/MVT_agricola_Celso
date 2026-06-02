-- Tabla de Recomendaciones Agronómicas
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  cultivo_id UUID REFERENCES cultivos(id),
  recommendation_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  climate_data_fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_stale BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_recommendations_tenant ON recommendations(tenant_id);
CREATE INDEX idx_recommendations_parcela ON recommendations(parcela_id, generated_at DESC);
CREATE INDEX idx_recommendations_cultivo ON recommendations(cultivo_id, recommendation_type);

-- Tabla de Recordatorios de Tareas Agrícolas
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  cultivo_id UUID REFERENCES cultivos(id),
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('riego','poda','fertilizacion')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','upcoming','completed')),
  source VARCHAR(50) NOT NULL DEFAULT 'auto'
    CHECK (source IN ('auto','manual')),
  reasoning TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_tenant_status ON reminders(tenant_id, status, scheduled_at);
CREATE INDEX idx_reminders_parcela ON reminders(parcela_id, scheduled_at);
CREATE INDEX idx_reminders_cultivo ON reminders(cultivo_id);
