-- Tabla de Datos Climáticos
CREATE TABLE climate_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  temperature_celsius DECIMAL(5, 2),
  relative_humidity_percent DECIMAL(5, 2),
  wind_speed_kmh DECIMAL(5, 2),
  precipitation_probability_percent DECIMAL(5, 2),
  forecast_72h JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_climate_parcela ON climate_data(parcela_id, fetched_at DESC);
CREATE INDEX idx_climate_tenant ON climate_data(tenant_id);

-- Tabla de Datos de Suelo
CREATE TABLE soil_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  measurement_date DATE NOT NULL,
  ph DECIMAL(4, 2) NOT NULL CHECK (ph >= 0 AND ph <= 14),
  humidity_percent DECIMAL(5, 2) NOT NULL CHECK (humidity_percent >= 0 AND humidity_percent <= 100),
  nitrogen_level DECIMAL(8, 2),
  phosphorus_level DECIMAL(8, 2),
  potassium_level DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_soil_parcela ON soil_data(parcela_id, measurement_date DESC);
CREATE INDEX idx_soil_tenant ON soil_data(tenant_id);

-- Tabla de Umbrales de Alerta
CREATE TABLE alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID REFERENCES parcelas(id),
  threshold_type VARCHAR(50) NOT NULL,
  min_value DECIMAL(10, 2),
  max_value DECIMAL(10, 2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_thresholds_parcela ON alert_thresholds(parcela_id);
CREATE INDEX idx_thresholds_tenant ON alert_thresholds(tenant_id);

-- Tabla de Alertas
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  alert_type VARCHAR(50) NOT NULL,
  detected_value DECIMAL(10, 2) NOT NULL,
  threshold_value DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  grouped_count INTEGER NOT NULL DEFAULT 1,
  first_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX idx_alerts_parcela ON alerts(parcela_id, created_at DESC);
CREATE INDEX idx_alerts_grouping ON alerts(tenant_id, parcela_id, alert_type, last_triggered_at);
