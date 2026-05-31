-- Tabla de Parcelas
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  area_hectares DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_parcelas_tenant ON parcelas(tenant_id);
CREATE INDEX idx_parcelas_active ON parcelas(tenant_id, is_active);

-- Tabla de Cultivos
CREATE TABLE cultivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  species VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  planting_date DATE NOT NULL,
  estimated_harvest_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cultivos_tenant ON cultivos(tenant_id);
CREATE INDEX idx_cultivos_parcela ON cultivos(parcela_id, planting_date DESC);
