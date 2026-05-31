-- Tabla de Parámetros de Cultivos (datos públicos compartidos, NO multi-tenant)
CREATE TABLE crop_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  temp_min_germinacion DECIMAL(5, 2) NOT NULL,
  temp_max_germinacion DECIMAL(5, 2) NOT NULL,
  temp_optima_min DECIMAL(5, 2),
  temp_optima_max DECIMAL(5, 2),
  dias_a_cosecha INTEGER NOT NULL,
  hemisferio_sur_meses_siembra INTEGER[] NOT NULL,
  hemisferio_norte_meses_siembra INTEGER[] NOT NULL,
  ventana_poda_meses INTEGER[],
  calendario_fertilizacion JSONB,
  humedad_suelo_optima_min DECIMAL(5, 2),
  humedad_suelo_optima_max DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(species, variety)
);

CREATE INDEX idx_crop_parameters_species ON crop_parameters(species);
