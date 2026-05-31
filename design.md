# Documento de Diseño Técnico

## Introducción

Este documento describe la arquitectura técnica del MVP de Gestión de Cosechas Inteligentes, un SaaS multi-tenant para pequeños y medianos productores agrícolas de Chile y Latinoamérica. El sistema se construye con Next.js (React + TypeScript) desplegado en Vercel, con Supabase (PostgreSQL gestionado + Auth) como backend de datos y autenticación, y Open-Meteo como API climática primaria. El enfoque es mobile-first, con aislamiento de datos por tenant reforzado mediante Row Level Security (RLS) de PostgreSQL/Supabase. Todos los servicios externos integrados utilizan exclusivamente sus planes gratuitos para mantener un costo operativo cero durante el MVP.

## Arquitectura General

### Diagrama de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                         Vercel (Free Tier)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Cliente Next.js (App Router)               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────────┐ │ │
│  │  │Dashboard │ │Parcelas  │ │Cultivos │ │Recom./Recordat│ │ │
│  │  └──────────┘ └──────────┘ └─────────┘ └───────────────┘ │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │ Server Actions / fetch                │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │           API Layer (Next.js API Routes / RSC)              │ │
│  │  ┌──────────────┐ ┌────────────────┐ ┌──────────────────┐ │ │
│  │  │Supabase Auth │ │Tenant + RLS    │ │Rate Limiter       │ │ │
│  │  │Helpers (SSR) │ │Context Filter  │ │                   │ │ │
│  │  └──────────────┘ └────────────────┘ └──────────────────┘ │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │                     Service Layer                            │ │
│  │ ┌───────┐┌───────┐┌───────┐┌───────┐┌─────┐┌──────┐┌─────┐│ │
│  │ │Parcel.│Cultivo││Clima  ││Suelo  ││Alert││Recom.││Remind││ │
│  │ │Service│Service│Service │Service │Svc  ││Svc   ││Svc   ││ │
│  │ └───────┘└───────┘└───────┘└───────┘└─────┘└──────┘└─────┘│ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │                Vercel Cron Jobs (Free Tier)                 │ │
│  │  - /api/cron/climate          (cada 60 min)                 │ │
│  │  - /api/cron/recommendations  (cada 24 h)                   │ │
│  │  - /api/cron/reminders        (cada 60 min)                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────┬─────────────────────────────────────┬────────────────┘
           │                                     │
           │ supabase-js / @supabase/ssr         │ HTTPS (sin auth)
           ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Supabase (Free Tier)        │    │  Open-Meteo API (gratis)      │
│  ┌────────────────────────┐  │    │  https://api.open-meteo.com/  │
│  │ PostgreSQL + RLS       │  │    │   v1/forecast                 │
│  │  - tenants, users      │  │    │   (current + hourly + daily)  │
│  │  - parcelas, cultivos  │  │    │                                │
│  │  - climate_data, soil  │  │    │  Fallback opcional:            │
│  │  - alerts, thresholds  │  │    │   OpenWeatherMap free tier     │
│  │  - crop_parameters     │  │    │   (requiere API key)           │
│  │  - recommendations     │  │    └──────────────────────────────┘
│  │  - reminders           │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Supabase Auth          │  │
│  │  (email/password,      │  │
│  │   sesiones, JWT)       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Principios Arquitectónicos

1. **Multi-tenant compartido con RLS**: Todas las tablas de negocio incluyen `tenant_id`. El aislamiento se refuerza con políticas de Row Level Security de PostgreSQL/Supabase, complementando el filtrado a nivel de aplicación.
2. **Auth delegada a Supabase**: Supabase Auth gestiona registro, login, sesiones y emisión de JWT. El sistema lee el `tenant_id` desde un claim del JWT (asignado mediante metadatos de usuario).
3. **Mobile-first**: Componentes diseñados para 320px mínimo, escalando a desktop.
4. **Capas desacopladas**: Presentación → API → Servicios → Repositorios (cliente Supabase) → BD.
5. **Fail-safe para datos externos**: Si Open-Meteo falla, se muestran últimos datos válidos con flag `isStale` y se intenta el fallback (OpenWeatherMap) si está configurado.
6. **Soft-delete**: Las parcelas eliminadas se marcan como inactivas, preservando historial.
7. **Despliegue serverless en Vercel**: Toda la API y los jobs cron corren como Vercel Functions; no hay servidor persistente.

## Modelo de Datos

### Esquema de Base de Datos (Supabase / PostgreSQL)

Las migraciones se versionan con Supabase CLI bajo `supabase/migrations/`. La autenticación se delega a `auth.users` (esquema gestionado por Supabase Auth), por lo que **no creamos una tabla `users` propia** — la tabla `user_profiles` contiene los datos específicos de la aplicación y se relaciona 1:1 con `auth.users.id`.

```sql
-- Tabla de Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perfil de usuario (extiende auth.users gestionado por Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);

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
```

```sql
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
```

```sql
-- Tabla de Parámetros de Cultivos (datos públicos compartidos, NO multi-tenant)
-- Seed inicial con cultivos comunes en Chile/Latam: uva, palta, manzana, tomate,
-- lechuga, papa, trigo, maíz, cereza, arándano, frambuesa, kiwi, durazno/nectarín,
-- ciruela, poroto (frijol), cebolla, ajo, zapallo, pimiento/ají, choclo (maíz dulce),
-- remolacha, zanahoria, espinaca, acelga, alcachofa, espárrago, avena, cebada, raps (canola).
CREATE TABLE crop_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  temp_min_germinacion DECIMAL(5, 2) NOT NULL,
  temp_max_germinacion DECIMAL(5, 2) NOT NULL,
  temp_optima_min DECIMAL(5, 2),
  temp_optima_max DECIMAL(5, 2),
  dias_a_cosecha INTEGER NOT NULL,
  hemisferio_sur_meses_siembra INTEGER[] NOT NULL,  -- ej: {8,9,10} = ago/sep/oct
  hemisferio_norte_meses_siembra INTEGER[] NOT NULL,
  ventana_poda_meses INTEGER[],
  calendario_fertilizacion JSONB,                   -- ej: [{ "dap": 30, "tipo": "N" }]
  humedad_suelo_optima_min DECIMAL(5, 2),
  humedad_suelo_optima_max DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(species, variety)
);

CREATE INDEX idx_crop_parameters_species ON crop_parameters(species);

-- Tabla de Recomendaciones Agronómicas (cache, multi-tenant)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  cultivo_id UUID REFERENCES cultivos(id),
  recommendation_type VARCHAR(50) NOT NULL,         -- 'siembra' | 'cosecha'
  payload JSONB NOT NULL,                           -- { window_start, window_end, reasoning, climate_snapshot }
  climate_data_fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_stale BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL      -- generated_at + 24h
);

CREATE INDEX idx_recommendations_tenant ON recommendations(tenant_id);
CREATE INDEX idx_recommendations_parcela ON recommendations(parcela_id, generated_at DESC);
CREATE INDEX idx_recommendations_cultivo ON recommendations(cultivo_id, recommendation_type);

-- Tabla de Recordatorios de Tareas Agrícolas (multi-tenant)
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parcela_id UUID NOT NULL REFERENCES parcelas(id),
  cultivo_id UUID REFERENCES cultivos(id),
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('riego','poda','fertilizacion')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','upcoming','completed')),
  source VARCHAR(50) NOT NULL DEFAULT 'auto'        -- 'auto' | 'manual'
    CHECK (source IN ('auto','manual')),
  reasoning TEXT,                                    -- justificación del cálculo
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_tenant_status ON reminders(tenant_id, status, scheduled_at);
CREATE INDEX idx_reminders_parcela ON reminders(parcela_id, scheduled_at);
CREATE INDEX idx_reminders_cultivo ON reminders(cultivo_id);
```

### Políticas de Row Level Security (RLS)

Supabase impone RLS a nivel de PostgreSQL como **segunda capa de defensa** sobre el filtrado de aplicación. Cada tabla multi-tenant activa RLS y define una política basada en `auth.uid()` y el `tenant_id` del perfil del usuario.

```sql
-- Helper: función que extrae el tenant_id del usuario autenticado
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID
LANGUAGE SQL STABLE AS $$
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

-- Política genérica para tablas con tenant_id (ejemplo: parcelas)
CREATE POLICY tenant_isolation_select ON parcelas
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY tenant_isolation_insert ON parcelas
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY tenant_isolation_update ON parcelas
  FOR UPDATE USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());        -- impide cambiar tenant_id

CREATE POLICY tenant_isolation_delete ON parcelas
  FOR DELETE USING (tenant_id = auth.tenant_id());

-- Repetir el patrón para: cultivos, climate_data, soil_data, alerts,
-- alert_thresholds, recommendations, reminders.

-- crop_parameters es público de lectura, escritura solo via service_role:
ALTER TABLE crop_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY crop_parameters_public_read ON crop_parameters
  FOR SELECT USING (TRUE);
-- (sin políticas INSERT/UPDATE/DELETE → solo el service_role key puede escribir)
```

### Tipos TypeScript del Modelo

```typescript
// types/models.ts

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'basic' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;            // = auth.users.id
  tenantId: string;
  email: string;         // proviene de auth.users
  role: 'admin' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

interface Parcela {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CultivoStatus = 'active' | 'harvested' | 'lost';

interface Cultivo {
  id: string;
  tenantId: string;
  parcelaId: string;
  species: string;
  variety: string | null;
  plantingDate: Date;
  estimatedHarvestDate: Date | null;
  status: CultivoStatus;
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ClimateData {
  id: string;
  tenantId: string;
  parcelaId: string;
  temperatureCelsius: number | null;
  relativeHumidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationProbabilityPercent: number | null;
  forecast72h: object | null;
  fetchedAt: Date;
  createdAt: Date;
}

interface SoilData {
  id: string;
  tenantId: string;
  parcelaId: string;
  measurementDate: Date;
  ph: number;
  humidityPercent: number;
  nitrogenLevel: number | null;
  phosphorusLevel: number | null;
  potassiumLevel: number | null;
  createdAt: Date;
}

type AlertType = 'temp_min' | 'temp_max' | 'soil_humidity_min' | 'precipitation_high';
type AlertStatus = 'pending' | 'read';

interface Alert {
  id: string;
  tenantId: string;
  parcelaId: string;
  alertType: AlertType;
  detectedValue: number;
  thresholdValue: number;
  status: AlertStatus;
  groupedCount: number;
  firstTriggeredAt: Date;
  lastTriggeredAt: Date;
  readAt: Date | null;
  createdAt: Date;
}

interface AlertThreshold {
  id: string;
  tenantId: string;
  parcelaId: string | null;
  thresholdType: AlertType;
  minValue: number | null;
  maxValue: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CropParameters {
  id: string;
  species: string;
  variety: string | null;
  tempMinGerminacion: number;
  tempMaxGerminacion: number;
  tempOptimaMin: number | null;
  tempOptimaMax: number | null;
  diasACosecha: number;
  hemisferioSurMesesSiembra: number[];
  hemisferioNorteMesesSiembra: number[];
  ventanaPodaMeses: number[] | null;
  calendarioFertilizacion: { dap: number; tipo: string }[] | null;
  humedadSueloOptimaMin: number | null;
  humedadSueloOptimaMax: number | null;
  notes: string | null;
}

type RecommendationType = 'siembra' | 'cosecha';

interface RecommendationPayload {
  windowStart: string;            // ISO date
  windowEnd: string;              // ISO date
  estimatedHarvestDate?: string;  // ISO date (sólo cosecha)
  reasoning: string;
  climateSnapshot: {
    temperature: number;
    humidity: number;
    precipitationProb: number;
  };
}

interface Recommendation {
  id: string;
  tenantId: string;
  parcelaId: string;
  cultivoId: string | null;
  recommendationType: RecommendationType;
  payload: RecommendationPayload;
  climateDataFetchedAt: Date;
  isStale: boolean;
  generatedAt: Date;
  expiresAt: Date;
}

type ReminderTaskType = 'riego' | 'poda' | 'fertilizacion';
type ReminderStatus = 'pending' | 'upcoming' | 'completed';

interface Reminder {
  id: string;
  tenantId: string;
  parcelaId: string;
  cultivoId: string | null;
  taskType: ReminderTaskType;
  scheduledAt: Date;
  status: ReminderStatus;
  source: 'auto' | 'manual';
  reasoning: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Diseño de API

### Autenticación (Supabase Auth)

La autenticación se delega a **Supabase Auth**. Los endpoints `/api/auth/*` actúan como envoltorios delgados que invocan al cliente `@supabase/ssr` y, en el caso de registro, crean los registros de aplicación (`tenants` + `user_profiles`) usando el `service_role` key.

```typescript
// POST /api/auth/register
// 1. supabase.auth.signUp({ email, password })
// 2. Crear tenant + user_profile asociado al auth.users.id retornado
// 3. Actualizar app_metadata del usuario con { tenant_id } para que el JWT lo incluya
interface RegisterRequest {
  tenantName: string;
  email: string;
  password: string;
}
interface RegisterResponse {
  tenant: Tenant;
  user: User;            // perfil + email; nunca expone password
  session: { accessToken: string; expiresAt: string };
}

// POST /api/auth/login
// supabase.auth.signInWithPassword({ email, password })
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  user: User;
  session: { accessToken: string; expiresAt: string };
}

// POST /api/auth/logout
// supabase.auth.signOut() + clear cookies vía @supabase/ssr
```

Las sesiones se persisten mediante cookies HttpOnly gestionadas por `@supabase/ssr` (compatibles con Next.js Server Components y Route Handlers). El cliente del navegador usa `@supabase/supabase-js`.

### Parcelas

```typescript
// GET /api/parcelas
// Response: Parcela[] (filtradas por tenant_id del usuario autenticado)

// POST /api/parcelas
interface CreateParcelaRequest {
  name: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
}

// PUT /api/parcelas/:id
interface UpdateParcelaRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
  areaHectares?: number;
}

// DELETE /api/parcelas/:id
// Soft-delete: marca is_active = false
```

### Cultivos

```typescript
// GET /api/parcelas/:parcelaId/cultivos
// Response: Cultivo[] (ordenados por planting_date DESC)

// POST /api/parcelas/:parcelaId/cultivos
interface CreateCultivoRequest {
  species: string;
  variety?: string;
  plantingDate: string; // ISO date
  estimatedHarvestDate?: string; // ISO date
}

// PATCH /api/cultivos/:id/status
interface UpdateCultivoStatusRequest {
  status: CultivoStatus;
}
```

### Datos Climáticos

```typescript
// GET /api/parcelas/:parcelaId/climate
// Response: ClimateData (último registro disponible)
// Si no hay datos recientes, retorna último disponible con flag stale: true

interface ClimateResponse {
  data: ClimateData;
  isStale: boolean;
  lastSuccessfulFetch: string; // ISO datetime
}
```

### Datos de Suelo

```typescript
// GET /api/parcelas/:parcelaId/soil
// Query params: ?limit=20&offset=0
// Response: { data: SoilData[], total: number }

// POST /api/parcelas/:parcelaId/soil
interface CreateSoilDataRequest {
  measurementDate: string; // ISO date
  ph: number;             // 0-14
  humidityPercent: number; // 0-100
  nitrogenLevel?: number;
  phosphorusLevel?: number;
  potassiumLevel?: number;
}
```

### Alertas

```typescript
// GET /api/alerts
// Query params: ?status=pending&parcelaId=xxx
// Response: { data: Alert[], total: number }

// PATCH /api/alerts/:id/read
// Marca la alerta como leída

// GET /api/parcelas/:parcelaId/thresholds
// Response: AlertThreshold[]

// PUT /api/parcelas/:parcelaId/thresholds
interface UpdateThresholdsRequest {
  thresholds: {
    thresholdType: AlertType;
    minValue?: number;
    maxValue?: number;
  }[];
}
```

### Dashboard

```typescript
// GET /api/dashboard
interface DashboardResponse {
  summary: {
    activeParcelas: number;
    activeCultivos: number;
    pendingAlerts: number;
    upcomingReminders: number;        // recordatorios con scheduled_at < now + 24h
  };
  parcelas: (Parcela & {
    latestClimate: ClimateResponse | null;
    latestRecommendation: Recommendation | null;
  })[];
  recentAlerts: Alert[];
  upcomingReminders: Reminder[];      // top N ordenados por scheduled_at ASC
}

// GET /api/dashboard/parcela/:id
interface ParcelaDetailResponse {
  parcela: Parcela;
  activeCultivos: Cultivo[];
  latestSoilData: SoilData[];
  climate: ClimateResponse | null;
  recommendations: Recommendation[];
  reminders: Reminder[];
}
```

### Recomendaciones Agronómicas

```typescript
// GET /api/parcelas/:parcelaId/recommendations
// Query params: ?type=siembra|cosecha&cultivoId=xxx
// Response: Recommendation[] (cache vigente, refrescada cada 24h vía cron)
// Si la API climática falla: retorna la última cacheada con isStale: true.

// POST /api/parcelas/:parcelaId/recommendations/refresh
// Forzar regeneración inmediata (uso manual desde UI)
interface RefreshRecommendationRequest {
  cultivoId?: string;
  type: RecommendationType;
}
interface RefreshRecommendationResponse {
  recommendation: Recommendation;
  isStale: boolean;
}

// 422 si la especie/variedad del cultivo no tiene parámetros agronómicos:
// { error: "No hay parámetros agronómicos para esta especie/variedad",
//   code: "CROP_PARAMETERS_NOT_FOUND" }
```

### Recordatorios de Tareas Agrícolas

```typescript
// GET /api/reminders
// Query params: ?status=pending|upcoming|completed&parcelaId=xxx&from=ISO&to=ISO
interface ReminderListResponse {
  data: Reminder[];      // ordenados por scheduled_at ASC para pendientes/próximos
  total: number;
}

// POST /api/reminders
interface CreateReminderRequest {
  parcelaId: string;
  cultivoId?: string;
  taskType: ReminderTaskType;
  scheduledAt: string;   // ISO datetime
  source?: 'manual';     // por defecto manual cuando viene del usuario
}

// PATCH /api/reminders/:id
interface UpdateReminderRequest {
  scheduledAt?: string;
  status?: 'pending' | 'completed';
}

// PATCH /api/reminders/:id/complete
// Marca como 'completed' y registra completed_at = now()

// DELETE /api/reminders/:id
// Eliminar (sólo recordatorios source='manual')
```

## Componentes y Estructura del Proyecto

### Estructura de Directorios

```
.
├── supabase/                     # Gestionado por Supabase CLI
│   ├── config.toml
│   ├── migrations/               # SQL versionado (incluye RLS)
│   │   ├── 0001_init_tenants_users.sql
│   │   ├── 0002_init_parcelas_cultivos.sql
│   │   ├── 0003_init_climate_soil_alerts.sql
│   │   ├── 0004_init_crop_parameters.sql
│   │   ├── 0005_init_recommendations_reminders.sql
│   │   └── 0006_rls_policies.sql
│   └── seed.sql                  # Seed inicial de crop_parameters
├── vercel.json                   # Configuración de Vercel Cron
├── .env.example                  # Plantilla de variables de entorno
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Dashboard principal
│   │   │   ├── parcelas/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── cultivos/[parcelaId]/page.tsx
│   │   │   ├── suelo/[parcelaId]/page.tsx
│   │   │   ├── recomendaciones/[parcelaId]/page.tsx
│   │   │   ├── recordatorios/page.tsx
│   │   │   └── alertas/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── logout/route.ts
│   │       ├── parcelas/[...]/route.ts
│   │       ├── cultivos/[...]/route.ts
│   │       ├── climate/[...]/route.ts
│   │       ├── soil/[...]/route.ts
│   │       ├── alerts/[...]/route.ts
│   │       ├── recommendations/[...]/route.ts
│   │       ├── reminders/[...]/route.ts
│   │       ├── dashboard/route.ts
│   │       └── cron/
│   │           ├── climate/route.ts          # cada 60 min
│   │           ├── recommendations/route.ts  # cada 24 h
│   │           └── reminders/route.ts        # cada 60 min (marcar upcoming)
│   ├── components/
│   │   ├── ui/                   # Componentes base reutilizables
│   │   ├── dashboard/
│   │   │   ├── DashboardSummary.tsx
│   │   │   ├── ParcelaCard.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   └── RemindersBanner.tsx
│   │   ├── parcelas/
│   │   ├── cultivos/
│   │   ├── soil/
│   │   ├── alerts/
│   │   ├── recommendations/
│   │   │   └── RecommendationCard.tsx
│   │   └── reminders/
│   │       ├── ReminderList.tsx
│   │       └── ReminderForm.tsx
│   ├── lib/
│   │   ├── supabase/             # Clientes Supabase
│   │   │   ├── client.ts         # Cliente browser (@supabase/supabase-js)
│   │   │   ├── server.ts         # Cliente server (cookies, @supabase/ssr)
│   │   │   └── service-role.ts   # Cliente con service_role (server only)
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── parcela.service.ts
│   │   │   ├── cultivo.service.ts
│   │   │   ├── climate.service.ts
│   │   │   ├── soil.service.ts
│   │   │   ├── alert.service.ts
│   │   │   ├── recommendation.service.ts
│   │   │   └── reminder.service.ts
│   │   ├── repositories/         # Acceso a datos vía Supabase client
│   │   │   ├── base.repository.ts
│   │   │   ├── parcela.repository.ts
│   │   │   ├── cultivo.repository.ts
│   │   │   ├── climate.repository.ts
│   │   │   ├── soil.repository.ts
│   │   │   ├── alert.repository.ts
│   │   │   ├── recommendation.repository.ts
│   │   │   └── reminder.repository.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Lectura de sesión Supabase + tenant_id
│   │   │   └── tenant-filter.ts
│   │   ├── validators/           # Validación con Zod
│   │   │   ├── parcela.schema.ts
│   │   │   ├── cultivo.schema.ts
│   │   │   ├── soil.schema.ts
│   │   │   ├── recommendation.schema.ts
│   │   │   └── reminder.schema.ts
│   │   └── utils/
│   │       ├── climate-api.ts            # Cliente Open-Meteo (+ fallback OWM)
│   │       ├── alert-engine.ts
│   │       ├── recommendation-engine.ts  # Lógica agronómica + hemisferio sur
│   │       └── reminder-engine.ts        # Cálculo de fechas sugeridas
│   ├── hooks/                    # React hooks personalizados
│   └── types/                    # Tipos TypeScript compartidos
└── ...
```

## Componentes Clave

### Cliente Supabase (Server-side con SSR)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );
}

// lib/supabase/service-role.ts (uso solo server-side: cron, registro inicial)
import { createClient } from '@supabase/supabase-js';

export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // bypass RLS — usar con cuidado
    { auth: { persistSession: false } }
  );
}
```

### Middleware de Tenant Context (Supabase Auth)

```typescript
// lib/middleware/tenant-filter.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface TenantContext {
  userId: string;
  tenantId: string;
}

export async function withTenantContext(
  req: NextRequest,
  handler: (ctx: TenantContext, supabase: ReturnType<typeof createSupabaseServerClient>) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Sesión requerida', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // tenant_id se persiste en app_metadata del JWT (asignado en registro)
  // Fallback: leer desde user_profiles si app_metadata no lo trae
  const tenantId = user.app_metadata?.tenant_id
    ?? (await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()).data?.tenant_id;

  if (!tenantId) {
    console.error('[SECURITY] Sesión sin tenant_id válido', {
      userId: user.id,
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: 'Contexto de tenant inválido', code: 'TENANT_CONTEXT_INVALID' },
      { status: 403 }
    );
  }

  return handler({ userId: user.id, tenantId }, supabase);
}
```

### Repositorio Base (sobre Cliente Supabase)

Las consultas se realizan a través del cliente Supabase del request, que ya transporta la sesión del usuario y por tanto activa las políticas RLS de PostgreSQL. El filtrado por `tenant_id` se aplica también explícitamente a nivel de aplicación como **defensa en profundidad**.

```typescript
// lib/repositories/base.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class TenantScopedRepository {
  constructor(
    protected supabase: SupabaseClient,
    protected tenantId: string,
    protected tableName: string
  ) {}

  /**
   * Las queries pasan por dos capas de aislamiento:
   *   1. Aplicación: .eq('tenant_id', this.tenantId)
   *   2. Base de datos: políticas RLS sobre auth.tenant_id()
   * El UPDATE nunca incluye tenant_id en el payload (inmutabilidad).
   */
  protected scoped() {
    return this.supabase.from(this.tableName).select().eq('tenant_id', this.tenantId);
  }

  protected async verifyOwnership(resourceId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', resourceId)
      .eq('tenant_id', this.tenantId)
      .maybeSingle();
    return data !== null;
  }
}
```

### Motor de Evaluación de Alertas

```typescript
// lib/utils/alert-engine.ts

interface ThresholdConfig {
  thresholdType: AlertType;
  minValue: number | null;
  maxValue: number | null;
}

const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  { thresholdType: 'temp_min', minValue: 0, maxValue: null },
  { thresholdType: 'temp_max', minValue: null, maxValue: 40 },
  { thresholdType: 'soil_humidity_min', minValue: 20, maxValue: null },
  { thresholdType: 'precipitation_high', minValue: null, maxValue: 80 },
];

export function evaluateAlerts(
  climateData: ClimateData | null,
  soilData: SoilData | null,
  customThresholds: ThresholdConfig[],
  parcelaId: string
): AlertTrigger[] {
  const thresholds = mergeThresholds(DEFAULT_THRESHOLDS, customThresholds);
  const triggers: AlertTrigger[] = [];

  for (const threshold of thresholds) {
    const value = getValueForType(threshold.thresholdType, climateData, soilData);
    if (value === null) continue;

    if (threshold.minValue !== null && value < threshold.minValue) {
      triggers.push({
        parcelaId,
        alertType: threshold.thresholdType,
        detectedValue: value,
        thresholdValue: threshold.minValue,
      });
    }
    if (threshold.maxValue !== null && value > threshold.maxValue) {
      triggers.push({
        parcelaId,
        alertType: threshold.thresholdType,
        detectedValue: value,
        thresholdValue: threshold.maxValue,
      });
    }
  }

  return triggers;
}

export function mergeThresholds(
  defaults: ThresholdConfig[],
  custom: ThresholdConfig[]
): ThresholdConfig[] {
  const customMap = new Map(custom.map(t => [t.thresholdType, t]));
  return defaults.map(d => customMap.get(d.thresholdType) ?? d);
}
```

### Consolidación de Alertas (Agrupamiento en Ventana de 60 min)

```typescript
// lib/services/alert.service.ts

const GROUPING_WINDOW_MS = 60 * 60 * 1000; // 60 minutos

export async function processAlertTrigger(
  trigger: AlertTrigger,
  tenantId: string,
  alertRepo: AlertRepository
): Promise<Alert> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - GROUPING_WINDOW_MS);

  // Buscar alerta existente del mismo tipo/parcela dentro de la ventana
  const existingAlert = await alertRepo.findRecentAlert(
    trigger.parcelaId,
    trigger.alertType,
    windowStart
  );

  if (existingAlert) {
    // Agrupar: incrementar contador y actualizar timestamp
    return alertRepo.incrementGroupedAlert(existingAlert.id, trigger.detectedValue, now);
  }

  // Crear nueva alerta
  return alertRepo.create({
    tenantId,
    parcelaId: trigger.parcelaId,
    alertType: trigger.alertType,
    detectedValue: trigger.detectedValue,
    thresholdValue: trigger.thresholdValue,
    status: 'pending',
    groupedCount: 1,
    firstTriggeredAt: now,
    lastTriggeredAt: now,
  });
}
```

### Cliente de API Climática (Open-Meteo + Fallback OpenWeatherMap)

**Provider primario: Open-Meteo** (gratis, sin API key, hasta ~10 000 calls/día).
URL base: `https://api.open-meteo.com/v1/forecast`. Se solicitan los bloques `current`, `hourly` y `daily` para 72 h.

```typescript
// lib/utils/climate-api.ts

interface ClimateApiResponse {
  temperature: number;       // °C
  humidity: number;          // %
  windSpeed: number;         // km/h
  precipitationProb: number; // %
  forecast72h: object;
  source: 'open-meteo' | 'openweathermap';
}

const PROVIDER = process.env.CLIMATE_API_PROVIDER ?? 'open-meteo';

async function fetchOpenMeteo(lat: number, lon: number): Promise<ClimateApiResponse | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability');
    url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation_probability');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    url.searchParams.set('forecast_days', '3');
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      precipitationProb: data.current.precipitation_probability ?? 0,
      forecast72h: { hourly: data.hourly, daily: data.daily },
      source: 'open-meteo',
    };
  } catch {
    return null;
  }
}

// Fallback documentado: OpenWeatherMap free tier (requiere OPENWEATHER_API_KEY)
async function fetchOpenWeatherMap(lat: number, lon: number): Promise<ClimateApiResponse | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Adaptación a la forma común
    return {
      temperature: data.list[0].main.temp,
      humidity: data.list[0].main.humidity,
      windSpeed: data.list[0].wind.speed * 3.6,        // m/s → km/h
      precipitationProb: (data.list[0].pop ?? 0) * 100,
      forecast72h: { list: data.list.slice(0, 24) },   // 3 h x 24 = 72 h
      source: 'openweathermap',
    };
  } catch {
    return null;
  }
}

export async function fetchClimateData(
  latitude: number,
  longitude: number
): Promise<ClimateApiResponse | null> {
  if (PROVIDER === 'open-meteo') {
    const primary = await fetchOpenMeteo(latitude, longitude);
    return primary ?? (await fetchOpenWeatherMap(latitude, longitude));
  }
  return fetchOpenWeatherMap(latitude, longitude);
}
```

### Validación con Zod

```typescript
// lib/validators/parcela.schema.ts
import { z } from 'zod';

export const createParcelaSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  areaHectares: z.number().positive('La superficie debe ser mayor a 0'),
});

// lib/validators/soil.schema.ts
export const createSoilDataSchema = z.object({
  measurementDate: z.string().date(),
  ph: z.number().min(0, 'El pH debe ser entre 0 y 14').max(14, 'El pH debe ser entre 0 y 14'),
  humidityPercent: z.number()
    .min(0, 'La humedad debe ser entre 0% y 100%')
    .max(100, 'La humedad debe ser entre 0% y 100%'),
  nitrogenLevel: z.number().optional(),
  phosphorusLevel: z.number().optional(),
  potassiumLevel: z.number().optional(),
});

// lib/validators/cultivo.schema.ts
export const createCultivoSchema = z.object({
  species: z.string().min(1, 'La especie es obligatoria').max(255),
  variety: z.string().max(255).optional(),
  plantingDate: z.string().date(),
  estimatedHarvestDate: z.string().date().optional(),
});

export const updateCultivoStatusSchema = z.object({
  status: z.enum(['active', 'harvested', 'lost']),
});

// lib/validators/recommendation.schema.ts
export const refreshRecommendationSchema = z.object({
  cultivoId: z.string().uuid().optional(),
  type: z.enum(['siembra', 'cosecha']),
});

// lib/validators/reminder.schema.ts
export const createReminderSchema = z.object({
  parcelaId: z.string().uuid(),
  cultivoId: z.string().uuid().optional(),
  taskType: z.enum(['riego', 'poda', 'fertilizacion']),
  scheduledAt: z.string().datetime(),
  source: z.literal('manual').optional(),
});

export const updateReminderSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed']).optional(),
});
```

## Manejo de Errores

### Estrategia de Errores

```typescript
// lib/utils/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(
    public fields: { field: string; message: string }[]
  ) {
    super('Error de validación', 400, 'VALIDATION_ERROR');
  }
}

export class TenantAccessError extends AppError {
  constructor() {
    super('Acceso denegado al recurso', 403, 'TENANT_ACCESS_DENIED');
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}
```

### Respuestas de Error Estandarizadas

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  fields?: { field: string; message: string }[];
}

// Ejemplo: credenciales inválidas (no revela si el email existe)
// { error: "Credenciales inválidas", code: "AUTH_FAILED" }

// Ejemplo: campos faltantes en parcela
// { error: "Error de validación", code: "VALIDATION_ERROR",
//   fields: [{ field: "name", message: "El nombre es obligatorio" }] }

// Ejemplo: valor de suelo fuera de rango
// { error: "Error de validación", code: "VALIDATION_ERROR",
//   fields: [{ field: "ph", message: "El pH debe ser entre 0 y 14" }] }
```

## Integración con API Climática

### Estrategia de Actualización

- **Cron Job**: **Vercel Cron** (`/api/cron/climate`) ejecuta cada 60 minutos. La ruta valida un header `Authorization: Bearer ${CRON_SECRET}` para impedir invocaciones externas.
- **Por Parcela**: Consulta Open-Meteo para cada parcela activa del sistema; si Open-Meteo falla y `OPENWEATHER_API_KEY` está definido, se intenta el fallback.
- **Fail-safe**: Si ambas APIs fallan, se mantienen los últimos datos válidos con flag `isStale`.
- **Rate Limiting**: Se respeta el límite de ~10 000 llamadas/día de Open-Meteo. El cron usa `service_role` para escribir en cualquier tenant.

```typescript
// lib/services/climate.service.ts

export async function updateClimateForAllParcelas(): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: activeParcelas } = await supabase
    .from('parcelas')
    .select('id, tenant_id, latitude, longitude')
    .eq('is_active', true);

  for (const parcela of activeParcelas ?? []) {
    const data = await fetchClimateData(parcela.latitude, parcela.longitude);
    if (!data) continue;

    await supabase.from('climate_data').insert({
      tenant_id: parcela.tenant_id,
      parcela_id: parcela.id,
      temperature_celsius: data.temperature,
      relative_humidity_percent: data.humidity,
      wind_speed_kmh: data.windSpeed,
      precipitation_probability_percent: data.precipitationProb,
      forecast_72h: data.forecast72h,
      fetched_at: new Date().toISOString(),
    });

    // Evaluar alertas con nuevos datos climáticos
    const thresholds = await thresholdRepo.findForParcela(parcela.id);
    const latestSoil = await soilRepo.findLatest(parcela.id);
    const triggers = evaluateAlerts(data, latestSoil, thresholds, parcela.id);

    for (const trigger of triggers) {
      await processAlertTrigger(trigger, parcela.tenant_id, alertRepo);
    }
  }
}
```

## Motor de Recomendaciones Agronómicas

### Estrategia

- Servicio dedicado `recommendation.service.ts` y motor puro `recommendation-engine.ts`.
- Combina: parámetros de cultivo (`crop_parameters`), datos climáticos vigentes, latitud/longitud de la parcela, especie + variedad del cultivo.
- **Ajuste por hemisferio sur**: si `parcela.latitude < 0`, se usa `hemisferio_sur_meses_siembra`; en otro caso, `hemisferio_norte_meses_siembra`.
- **Cache 24 h**: las recomendaciones se persisten en `recommendations` con `expires_at = generated_at + 24h`. El endpoint GET retorna el cache; el cron `/api/cron/recommendations` regenera diariamente.
- **Fail-safe**: si Open-Meteo falla y existe una recomendación cacheada, se retorna con `isStale: true` y la fecha de los datos climáticos usados.
- **Especies sin parámetros**: si no hay fila en `crop_parameters` para `(species, variety)` ni para `(species, null)`, el endpoint responde `422 CROP_PARAMETERS_NOT_FOUND`.

```typescript
// lib/utils/recommendation-engine.ts

interface RecommendationInput {
  cultivo: Cultivo;
  parcela: Parcela;
  climate: ClimateData;
  cropParams: CropParameters;
}

export function generateSiembraRecommendation(
  input: RecommendationInput
): RecommendationPayload {
  const isSouthern = input.parcela.latitude < 0;
  const months = isSouthern
    ? input.cropParams.hemisferioSurMesesSiembra
    : input.cropParams.hemisferioNorteMesesSiembra;

  const { windowStart, windowEnd } = computeWindowFromMonths(months, new Date());
  const reasoning = buildReasoning({
    hemisphere: isSouthern ? 'sur' : 'norte',
    months,
    climate: input.climate,
    species: input.cultivo.species,
  });

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    reasoning,
    climateSnapshot: {
      temperature: input.climate.temperatureCelsius!,
      humidity: input.climate.relativeHumidityPercent!,
      precipitationProb: input.climate.precipitationProbabilityPercent!,
    },
  };
}

export function generateCosechaRecommendation(
  input: RecommendationInput
): RecommendationPayload {
  const planting = new Date(input.cultivo.plantingDate);
  const estimated = new Date(planting);
  estimated.setDate(estimated.getDate() + input.cropParams.diasACosecha);

  // Se ajusta el rango ±7 días según condiciones climáticas registradas.
  const start = new Date(estimated); start.setDate(estimated.getDate() - 7);
  const end   = new Date(estimated); end.setDate(estimated.getDate() + 7);

  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    estimatedHarvestDate: estimated.toISOString(),
    reasoning: `Estimación basada en ${input.cropParams.diasACosecha} días desde siembra (${input.cultivo.species}).`,
    climateSnapshot: {
      temperature: input.climate.temperatureCelsius!,
      humidity: input.climate.relativeHumidityPercent!,
      precipitationProb: input.climate.precipitationProbabilityPercent!,
    },
  };
}
```

## Motor de Recordatorios de Tareas Agrícolas

### Estrategia

- Servicio `reminder.service.ts` y motor puro `reminder-engine.ts`.
- Tres tipos de tarea con lógica diferenciada:
  - **Riego**: combina `humedad_suelo_optima_min` del cultivo, último `soil_data.humidity_percent` y `precipitation_probability_percent` a 72 h. Cuanto mayor el déficit hídrico previsto, más cercana la `scheduledAt`.
  - **Poda**: usa `ventana_poda_meses` de `crop_parameters` y la fase del ciclo (días desde `planting_date`).
  - **Fertilización**: cruza `calendario_fertilizacion` (DAP — días después de plantación) con niveles de N/P/K del último `soil_data`.
- El cron `/api/cron/reminders` corre cada 60 min y:
  1. Promueve a `'upcoming'` los recordatorios `'pending'` con `scheduled_at - now() < 24h`.
  2. Genera nuevos recordatorios automáticos (`source = 'auto'`) para parcelas/cultivos activos cuando corresponde.

```typescript
// lib/utils/reminder-engine.ts

interface IrrigationInput {
  lastSoilHumidityPercent: number;
  forecastPrecipitation72hMm: number;
  optimalHumidityMin: number;
  now: Date;
}

export function computeIrrigationDate(input: IrrigationInput): Date {
  const deficit = Math.max(0, input.optimalHumidityMin - input.lastSoilHumidityPercent);
  // Si el pronóstico de precipitación cubre el déficit, se difiere; si no, se adelanta.
  const expectedReliefHours = Math.min(72, input.forecastPrecipitation72hMm * 6);
  const urgencyHours = Math.max(2, 48 - deficit - expectedReliefHours);
  const scheduled = new Date(input.now);
  scheduled.setHours(scheduled.getHours() + urgencyHours);
  return scheduled;
}

export function computePruningDate(
  cultivo: Cultivo,
  cropParams: CropParameters,
  now: Date
): Date | null {
  if (!cropParams.ventanaPodaMeses?.length) return null;
  const isSouthern = cultivo.tenantId; // se determina vía parcela.latitude en el caller
  // Encuentra el próximo mes de la ventana ≥ ahora.
  const next = nextMonthInWindow(cropParams.ventanaPodaMeses, now);
  return next;
}
```

### Promoción a "upcoming"

```typescript
// Vercel Cron: /api/cron/reminders (cada 60 min)
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

await supabase
  .from('reminders')
  .update({ status: 'upcoming' })
  .eq('status', 'pending')
  .lte('scheduled_at', new Date(Date.now() + UPCOMING_WINDOW_MS).toISOString());
```

## Seguridad

### Autenticación (Supabase Auth)

- Registro, login, logout y gestión de sesiones se delegan a **Supabase Auth**.
- Supabase Auth almacena las contraseñas con bcrypt internamente y emite JWTs firmados con el secreto del proyecto. No se mantienen tablas de credenciales en la aplicación.
- El `tenant_id` se asigna en `app_metadata` del usuario en el momento del registro (lo cual lo incluye en el JWT) y se mantiene en `user_profiles` como respaldo y para joins.
- Las sesiones se persisten mediante cookies HttpOnly gestionadas por `@supabase/ssr`, compatibles con Server Components y Route Handlers.
- Los mensajes de error de login son los retornados por Supabase Auth, que **no revelan si el email existe** (mensaje genérico tipo "Invalid login credentials"). Los handlers de la aplicación los normalizan al formato de error de la API.
- La expiración del access token se configura en el dashboard de Supabase (default 1 h con refresh automático vía cookie de refresh).

### Aislamiento Multi-Tenant (defensa en profundidad)

- `tenant_id` es campo obligatorio en todas las tablas de negocio.
- **Capa 1 — Aplicación**: Los repositorios filtran por `tenant_id = ctx.tenantId` y verifican ownership antes de cualquier UPDATE/DELETE.
- **Capa 2 — Base de datos**: Las **políticas RLS de Supabase** filtran por `auth.tenant_id()` (helper que lee el perfil del usuario autenticado). Aún si la aplicación tuviera un bug, RLS impide leer/escribir datos de otro tenant.
- `tenant_id` es inmutable: las políticas `UPDATE ... WITH CHECK (tenant_id = auth.tenant_id())` impiden cambiar el campo.
- Operaciones sin sesión válida o sin `tenant_id` resoluble se rechazan con 403 y se registran como incidente.
- El `service_role` key sólo se utiliza desde rutas server-only (jobs cron, registro inicial). **Nunca se expone al navegador.**

### Validación de Entrada

- Todas las entradas se validan con Zod antes de procesarse.
- Sanitización de strings para prevenir XSS.
- El cliente Supabase usa internamente queries parametrizadas, previniendo SQL injection.

## Componentes de UI (Mobile-First)

### Principios de Diseño Responsivo

- **Breakpoints**: 320px (móvil), 768px (tablet), 1024px (desktop).
- **Navegación**: Menú hamburguesa colapsable en < 768px.
- **Touch targets**: Mínimo 44x44px para elementos interactivos.
- **Tipografía**: Mínimo 16px en móvil para legibilidad.
- **Layout**: CSS Grid/Flexbox con `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`.

### Componentes Principales

```typescript
// components/dashboard/DashboardSummary.tsx
// Muestra contadores: parcelas activas, cultivos en curso, alertas pendientes

// components/dashboard/ParcelaCard.tsx
// Tarjeta con info de parcela + datos climáticos actuales

// components/dashboard/AlertBanner.tsx
// Banner de alertas pendientes con acción de marcar como leída

// components/dashboard/RemindersBanner.tsx
// Banner que destaca los Recordatorios_Agrícolas próximos (< 24 h) en el dashboard

// components/parcelas/ParcelaForm.tsx
// Formulario de creación/edición con validación inline

// components/parcelas/ParcelaList.tsx
// Lista de parcelas con búsqueda y filtros

// components/cultivos/CultivoTimeline.tsx
// Timeline visual del ciclo productivo

// components/soil/SoilDataChart.tsx
// Gráfico de evolución de parámetros de suelo

// components/alerts/AlertList.tsx
// Lista de alertas con filtros por tipo y estado

// components/recommendations/RecommendationCard.tsx
// Tarjeta de recomendación agronómica (siembra/cosecha) con ventana óptima y reasoning

// components/reminders/ReminderList.tsx
// Lista de recordatorios con filtros por tipo y estado, acción "Completar"

// components/reminders/ReminderForm.tsx
// Formulario para crear recordatorios manuales

// components/ui/MobileNav.tsx
// Navegación colapsable para móvil
```

## Despliegue en Vercel

El proyecto se despliega en **Vercel (Free Tier)** como aplicación Next.js. No se ejecutan procesos de larga duración: toda la lógica server-side corre como Vercel Functions (serverless / edge según corresponda).

### Configuración de Vercel Cron

`vercel.json` define los jobs programados. Cada endpoint cron valida el header `Authorization: Bearer ${CRON_SECRET}` antes de ejecutar.

```json
{
  "crons": [
    { "path": "/api/cron/climate",         "schedule": "0 * * * *" },
    { "path": "/api/cron/recommendations", "schedule": "0 3 * * *" },
    { "path": "/api/cron/reminders",       "schedule": "0 * * * *" }
  ]
}
```

### Pipeline

1. **Repositorio Git** conectado a Vercel — cada push a `main` despliega automáticamente.
2. **Variables de entorno** configuradas en el Vercel Dashboard (Production / Preview / Development).
3. **Migraciones**: las migraciones SQL se aplican manualmente con `supabase db push` (Supabase CLI) contra el proyecto de Supabase. No se ejecutan migraciones desde Vercel para evitar acoplamiento de secretos.
4. **Build**: `next build` produce las API Routes como Vercel Functions y el front como sitio estático/SSR según la página.

### Notas operativas

- Los endpoints `/api/cron/*` no son accesibles públicamente (validación de `CRON_SECRET`).
- El `service_role` key de Supabase solo se inyecta como variable de entorno **en runtime server-side**, nunca prefijada con `NEXT_PUBLIC_`.
- Vercel Free Tier impone un timeout de 10 s por invocación serverless; los cron jobs deben procesar parcelas en bloques (chunking) si el número crece.

## Configuración de Variables de Entorno

El archivo `.env.example` documenta todas las variables necesarias para correr el proyecto local y como referencia para el Vercel Dashboard.

```bash
# .env.example

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# Solo server-side. NUNCA prefijar con NEXT_PUBLIC_. NUNCA exponer al navegador.
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# === API Climática ===
# Provider primario. Valores válidos: "open-meteo" | "openweathermap"
CLIMATE_API_PROVIDER=open-meteo
# Opcional: solo si se desea fallback a OpenWeatherMap free tier
OPENWEATHER_API_KEY=

# === Cron security ===
# Secreto para validar invocaciones a /api/cron/*. Generar con `openssl rand -hex 32`.
CRON_SECRET=<random-32-bytes-hex>
```

| Variable | Ámbito | Obligatoria | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + Server | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Server | Sí | Clave anónima (RLS-protegida) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Sí | Clave con bypass de RLS, usada por crons y registro inicial |
| `CLIMATE_API_PROVIDER` | Server only | No (default `open-meteo`) | Selecciona provider primario |
| `OPENWEATHER_API_KEY` | Server only | No | Habilita fallback a OpenWeatherMap |
| `CRON_SECRET` | Server only | Sí | Protege endpoints `/api/cron/*` |

## Límites de Planes Gratuitos

Para garantizar costo operativo cero en el MVP, todos los servicios externos integrados se mantienen dentro de sus planes gratuitos. Los límites vigentes al diseñar esta versión son:

| Servicio | Plan | Límites relevantes | Acción del Sistema al acercarse al límite |
|---|---|---|---|
| **Supabase** | Free | 500 MB storage de DB, 1 GB transferencia/mes, 50 000 MAU, 2 proyectos pausan tras 1 semana de inactividad | Logging de uso de storage por tabla; alerta al admin del Tenant si DB > 80% capacidad |
| **Vercel** | Hobby | 100 GB-h compute / mes, 100 GB ancho de banda / mes, 12 invocaciones de cron concurrentes, timeout 10 s por función | Logging de duración de cron jobs; chunking de parcelas si timeout se acerca a 8 s |
| **Open-Meteo** | Free | ~10 000 calls/día (rate-limit suave), sin API key | Contador diario de llamadas en logs; fallback a OpenWeatherMap si Open-Meteo retorna 429 |
| **OpenWeatherMap** (fallback) | Free | 60 calls/min, 1 000 000 calls/mes | Backoff exponencial; deshabilitar fallback si supera 80% del cuota mensual |

### Logging de Uso

Cada llamada a un servicio externo registra una entrada estructurada:

```typescript
// lib/utils/usage-logger.ts
export function logExternalCall(provider: string, ok: boolean, latencyMs: number) {
  console.log(JSON.stringify({
    type: 'external_call',
    provider,                 // 'supabase' | 'open-meteo' | 'openweathermap'
    ok,
    latencyMs,
    timestamp: new Date().toISOString(),
  }));
}
```

Estas entradas pueden agregarse desde Vercel Logs (o exportarse a un sink externo) para alertar cuando un proveedor se acerca a su umbral. Si un servicio externo supera su cuota, el Sistema:

1. Registra un evento `LIMIT_WARNING` en el log de operación.
2. Notifica al admin del Tenant correspondiente (cuando aplica).
3. Activa el comportamiento fail-safe documentado para ese servicio (datos cacheados, fallback alternativo).



## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema — esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquinas.*

### Property 1: Aislamiento de datos por tenant

*For any* usuario autenticado y *for any* consulta de datos ejecutada por el sistema, todos los registros retornados deben tener un `tenant_id` igual al del usuario autenticado, y ningún registro de otro tenant debe ser accesible.

**Validates: Requirements 1.3, 1.6, 2.2, 6.5, 9.2, 9.5**

### Property 2: Rechazo de operaciones sin tenant válido

*For any* operación de lectura o escritura que no incluya un `tenant_id` válido, el sistema debe rechazar la operación con error 403 y registrar un incidente de seguridad.

**Validates: Requirements 9.3**

### Property 3: Inmutabilidad de tenant_id

*For any* registro existente en cualquier tabla de negocio, cualquier intento de modificar el campo `tenant_id` debe ser rechazado por el sistema.

**Validates: Requirements 9.4**

### Property 4: Credenciales inválidas no revelan información

*For any* combinación de credenciales inválidas (email inexistente, contraseña incorrecta, o ambos), el mensaje de error retornado debe ser idéntico y genérico, sin revelar si el email existe en el sistema.

**Validates: Requirements 1.2**

### Property 5: Creación de parcela persiste todos los campos requeridos

*For any* datos válidos de parcela (nombre no vacío, latitud en [-90,90], longitud en [-180,180], superficie > 0), al crear la parcela, el registro persistido debe contener exactamente los mismos valores de nombre, ubicación, superficie y el `tenant_id` del usuario creador.

**Validates: Requirements 2.1**

### Property 6: Unicidad de nombre de parcela por tenant

*For any* tenant y *for any* par de parcelas activas dentro de ese tenant, sus nombres deben ser diferentes. Intentar crear una parcela con un nombre ya existente en el mismo tenant debe resultar en un error de validación.

**Validates: Requirements 2.5**

### Property 7: Soft-delete preserva datos históricos

*For any* parcela eliminada (marcada como inactiva), todos los registros históricos asociados (cultivos, datos de suelo, datos climáticos, alertas) deben permanecer accesibles en el sistema.

**Validates: Requirements 2.4**

### Property 8: Validación de campos obligatorios reporta campos faltantes

*For any* subconjunto de campos obligatorios omitidos al crear una parcela (nombre, ubicación, superficie), el error de validación debe listar exactamente los campos que faltan.

**Validates: Requirements 2.6**

### Property 9: Edición de parcela actualiza timestamp

*For any* edición válida de una parcela, el campo `updated_at` del registro resultante debe ser mayor o igual al valor anterior de `updated_at`, y los campos modificados deben reflejar los nuevos valores.

**Validates: Requirements 2.3**

### Property 10: Cultivo requiere parcela válida del tenant

*For any* intento de crear un cultivo con un `parcela_id` que no existe o que pertenece a otro tenant, el sistema debe rechazar la operación con un error descriptivo.

**Validates: Requirements 3.5**

### Property 11: Ordenamiento descendente por fecha

*For any* parcela con múltiples cultivos o múltiples registros de suelo, al consultar la lista, los registros deben estar ordenados por fecha (siembra o medición respectivamente) de forma descendente — es decir, para cualquier par consecutivo de registros en la lista, la fecha del primero debe ser mayor o igual a la del segundo.

**Validates: Requirements 3.2, 6.2**

### Property 12: Cambio de estado de cultivo registra fecha

*For any* transición de estado válida de un cultivo (active → harvested, active → lost), el sistema debe actualizar el campo `status` al nuevo valor y registrar en `status_changed_at` la fecha/hora del cambio.

**Validates: Requirements 3.3**

### Property 13: Dashboard refleja conteos reales

*For any* tenant con datos, los conteos del dashboard (parcelas activas, cultivos en curso, alertas pendientes) deben coincidir exactamente con el número real de registros que cumplen cada condición en la base de datos para ese tenant.

**Validates: Requirements 4.1**

### Property 14: Validación de rangos de datos de suelo

*For any* valor de pH fuera del rango [0, 14] o *for any* valor de humedad fuera del rango [0, 100], el sistema debe rechazar el registro y retornar un mensaje que indique el rango permitido. Inversamente, *for any* valor dentro de los rangos válidos, el registro debe ser aceptado.

**Validates: Requirements 6.3, 6.4**

### Property 15: Persistencia completa de datos de suelo

*For any* dato de suelo válido (pH en [0,14], humedad en [0,100], parcela válida del tenant), al crearlo, el registro persistido debe contener exactamente los mismos valores de parcela, fecha, pH, humedad y nutrientes opcionales proporcionados.

**Validates: Requirements 6.1**

### Property 16: Generación de alertas al superar umbral

*For any* dato climático o de suelo que supere un umbral configurado (personalizado o predeterminado) para una parcela, el sistema debe generar una alerta asociada a esa parcela con el tipo correcto, valor detectado, valor umbral y fecha de generación.

**Validates: Requirements 7.1, 7.4**

### Property 17: Umbrales personalizados reemplazan predeterminados

*For any* parcela con umbrales personalizados configurados, al evaluar alertas, el sistema debe utilizar los valores personalizados en lugar de los predeterminados. Para parcelas sin umbrales personalizados, deben aplicarse los predeterminados (temp_min=0°C, temp_max=40°C, soil_humidity_min=20%, precipitation>80%).

**Validates: Requirements 7.3**

### Property 18: Alerta marcada como leída no es pendiente

*For any* alerta marcada como leída, su estado debe ser 'read' y no debe ser contabilizada en el conteo de alertas pendientes del dashboard.

**Validates: Requirements 7.5**

### Property 19: Consolidación de alertas en ventana de 60 minutos

*For any* secuencia de alertas del mismo tipo generadas para la misma parcela dentro de un período de 60 minutos, el sistema debe consolidarlas en una sola alerta con `grouped_count` igual al número de ocurrencias, en lugar de crear alertas individuales.

**Validates: Requirements 7.6**

### Property 20: Persistencia de datos climáticos válidos

*For any* respuesta válida de la API climática, el sistema debe almacenar correctamente temperatura (°C), humedad relativa (%), velocidad del viento (km/h), probabilidad de precipitación (%) y pronóstico a 72 horas, asociados a la ubicación geográfica de la parcela correspondiente.

**Validates: Requirements 5.2, 5.4, 5.5**

### Property 21: Autenticación válida genera token

*For any* usuario con credenciales válidas (email registrado + contraseña correcta), el sistema debe autenticar exitosamente y retornar un token de sesión que contenga el `userId` y `tenantId` del usuario.

**Validates: Requirements 1.1**

### Property 22: Generación de recomendación con datos completos

*For any* parcela del tenant con un cultivo asociado cuya `(species, variety)` exista en `crop_parameters`, y datos climáticos vigentes disponibles, el sistema debe generar una recomendación que referencie la parcela, el cultivo y un snapshot climático no vacío.

**Validates: Requirements 10.1**

### Property 23: Ajuste por hemisferio sur

*For any* parcela con `latitude < 0` (hemisferio sur), la ventana de meses óptimos retornada por la recomendación de siembra debe ser un subconjunto de `crop_parameters.hemisferio_sur_meses_siembra`. Inversamente, *for any* parcela con `latitude >= 0`, la ventana debe pertenecer a `hemisferio_norte_meses_siembra`.

**Validates: Requirements 10.2**

### Property 24: Rango de siembra es válido

*For any* recomendación de siembra generada, los campos `windowStart` y `windowEnd` del payload deben cumplir `windowStart <= windowEnd`.

**Validates: Requirements 10.3**

### Property 25: Fecha de cosecha estimada es posterior a siembra

*For any* recomendación de cosecha generada para un cultivo con `plantingDate = P` y `crop_parameters.dias_a_cosecha = D`, la fecha estimada de cosecha retornada debe ser estrictamente posterior a `P` y la diferencia con `P` debe estar dentro del rango `[D - 7, D + 7]` días (la tolerancia ±7 días refleja el ajuste climático).

**Validates: Requirements 10.4**

### Property 26: Fail-safe de recomendación con datos cacheados

*For any* solicitud de recomendación realizada cuando la API climática falla y existe una recomendación cacheada vigente para `(parcela, cultivo, type)`, el sistema debe retornar dicha recomendación con `isStale = true` y el `climateDataFetchedAt` correspondiente al cache.

**Validates: Requirements 10.5**

### Property 27: Especies sin parámetros retornan error informativo

*For any* solicitud de recomendación para un cultivo cuya `(species, variety)` no tiene fila en `crop_parameters` (ni una fila genérica con `variety = NULL` para esa especie), el endpoint debe responder con código `422` y `code = 'CROP_PARAMETERS_NOT_FOUND'`, sin generar una recomendación.

**Validates: Requirements 10.7**

### Property 28: Round-trip de creación de recordatorio

*For any* recordatorio creado con datos válidos (`taskType` permitido, parcela y cultivo del tenant, `scheduledAt` parseable), al consultar el recordatorio por su `id`, los campos `taskType`, `parcelaId`, `cultivoId`, `scheduledAt` y `tenantId` deben coincidir exactamente con los enviados.

**Validates: Requirements 11.1**

### Property 29: Recordatorio de riego responde a déficit hídrico

*For any* par de estados con la misma parcela y cultivo donde el primero tiene mayor déficit hídrico (menor humedad de suelo + menor pronóstico de precipitación) que el segundo, el `scheduledAt` del recordatorio de riego generado para el primer estado debe ser **menor o igual** al `scheduledAt` generado para el segundo (mayor déficit ⇒ riego más pronto).

**Validates: Requirements 11.2**

### Property 30: Recordatorio de poda dentro de ventana del cultivo

*For any* recordatorio de poda generado automáticamente para un cultivo cuya `crop_parameters.ventana_poda_meses` está definida, el mes de `scheduledAt` debe pertenecer a esa ventana.

**Validates: Requirements 11.3**

### Property 31: Recordatorio de fertilización responde a déficit de nutrientes

*For any* par de estados con la misma parcela y cultivo donde el primero tiene niveles N/P/K más bajos que el segundo, el `scheduledAt` del recordatorio de fertilización generado para el primer estado debe ser menor o igual al del segundo.

**Validates: Requirements 11.4**

### Property 32: Listado de pendientes ordenado ascendentemente

*For any* tenant con múltiples recordatorios en estado `pending` o `upcoming`, al consultar la lista, para cualquier par consecutivo de elementos, `scheduledAt[i] <= scheduledAt[i+1]`.

**Validates: Requirements 11.5**

### Property 33: Completar recordatorio actualiza estado y excluye de pendientes

*For any* recordatorio en estado `pending` o `upcoming` que es marcado como completado, el registro resultante debe tener `status = 'completed'` y `completedAt != null`, y dicho recordatorio no debe aparecer en consultas filtradas por `status IN ('pending', 'upcoming')`.

**Validates: Requirements 11.6, 11.7**

### Property 34: Marcado "próximo" cuando faltan menos de 24 horas

*For any* recordatorio con `status = 'pending'` cuya `scheduledAt - now() < 24h`, tras la ejecución del job `/api/cron/reminders`, su estado debe cambiar a `'upcoming'`. *For any* recordatorio con `scheduledAt - now() >= 24h`, su estado debe permanecer `'pending'`.

**Validates: Requirements 11.8**
