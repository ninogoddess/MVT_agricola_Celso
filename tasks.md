# Implementation Plan: Smart Harvest Management

## Overview

Implementación del MVP de Gestión de Cosechas Inteligentes — un SaaS multi-tenant para pequeños y medianos productores agrícolas. Stack: **Next.js (App Router) + TypeScript** desplegado en **Vercel (Free Tier)**, **Supabase (PostgreSQL + Auth, Free Tier)** como backend de datos y autenticación, **Open-Meteo** como API climática primaria (sin API key) con fallback opcional a OpenWeatherMap, **Vercel Cron** para jobs programados (clima, recomendaciones, recordatorios), y validación con Zod. El plan sigue un enfoque incremental: primero la infraestructura (Supabase + RLS), luego servicios de negocio (parcelas, cultivos, suelo, clima, alertas, recomendaciones, recordatorios), y finalmente la capa de presentación mobile-first.

## Tasks

- [x] 1. Configuración del proyecto y estructura base
  - [x] 1.1 Inicializar proyecto Next.js con TypeScript y dependencias core
    - Crear proyecto Next.js con App Router y TypeScript
    - Instalar dependencias: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
    - Instalar dev: `supabase` (CLI), `@types/node`, `vitest` o `jest`, `fast-check` (para property tests)
    - Configurar `tsconfig.json` con paths aliases (`@/lib`, `@/components`, `@/types`, `@/hooks`)
    - Crear estructura de directorios según diseño (`src/app`, `src/lib`, `src/components`, `src/types`, `src/hooks`, `supabase/`)
    - _Requisitos: 8.6, 12.3_

  - [x] 1.2 Definir tipos TypeScript compartidos y esquemas de validación
    - Crear `src/types/models.ts` con todas las interfaces: `Tenant`, `User`, `Parcela`, `Cultivo`, `ClimateData`, `SoilData`, `Alert`, `AlertThreshold`, `CropParameters`, `Recommendation`, `RecommendationPayload`, `Reminder`
    - Crear `src/types/api.ts` con interfaces de request/response para todos los endpoints
    - Crear esquemas Zod en `src/lib/validators/`: `parcela.schema.ts`, `cultivo.schema.ts`, `soil.schema.ts`, `recommendation.schema.ts`, `reminder.schema.ts`
    - Implementar validación de rangos: pH [0-14], humedad [0-100], latitud [-90,90], longitud [-180,180]
    - _Requisitos: 2.1, 2.5, 2.6, 3.1, 6.1, 6.3, 6.4, 10.1, 11.1_

  - [x] 1.3 Configurar Supabase CLI y migraciones SQL
    - Inicializar Supabase local con `supabase init` (genera `supabase/config.toml`)
    - Crear migración `supabase/migrations/0001_init_tenants_users.sql` con `tenants` y `user_profiles` (FK a `auth.users`)
    - Crear migración `0002_init_parcelas_cultivos.sql` con tablas y constraints `UNIQUE(tenant_id, name)` en parcelas
    - Crear migración `0003_init_climate_soil_alerts.sql` con `climate_data`, `soil_data`, `alert_thresholds`, `alerts` (incluye CHECK ph 0-14 y humedad 0-100)
    - Crear migración `0004_init_crop_parameters.sql` con tabla `crop_parameters` (no multi-tenant, lectura pública)
    - Crear migración `0005_init_recommendations_reminders.sql` con `recommendations` y `reminders`
    - Incluir todos los índices definidos en el diseño
    - _Requisitos: 9.1, 2.5, 6.3, 10.1, 11.1, 12.4_

  - [x] 1.4 Crear `.env.example` y documentar variables de entorno
    - Crear `.env.example` con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIMATE_API_PROVIDER` (default `open-meteo`), `OPENWEATHER_API_KEY` (opcional), `CRON_SECRET`
    - Añadir comentarios indicando ámbito (cliente vs server-only) y obligatoriedad
    - Documentar generación de `CRON_SECRET` con `openssl rand -hex 32`
    - Añadir `.env.local` al `.gitignore`
    - _Requisitos: 12.3, 12.4, 12.5_

- [x] 2. Capa de datos: clientes Supabase y políticas RLS
  - [x] 2.1 Implementar clientes Supabase (browser, server, service role)
    - Crear `src/lib/supabase/client.ts` con `createBrowserClient` de `@supabase/ssr` (uso en componentes cliente)
    - Crear `src/lib/supabase/server.ts` con `createServerClient` que lee/escribe cookies vía `next/headers` (uso en Server Components y Route Handlers)
    - Crear `src/lib/supabase/service-role.ts` con cliente que usa `SUPABASE_SERVICE_ROLE_KEY` (uso server-only: cron, registro inicial); verificar al inicio que el módulo no se importa desde código cliente
    - _Requisitos: 1.3, 9.1, 9.2_

  - [x] 2.2 Crear migración de políticas RLS (Row Level Security)
    - Crear migración `supabase/migrations/0006_rls_policies.sql`
    - Crear función helper `auth.tenant_id()` que retorna el `tenant_id` del usuario autenticado desde `user_profiles`
    - Activar `ENABLE ROW LEVEL SECURITY` en: `tenants`, `user_profiles`, `parcelas`, `cultivos`, `climate_data`, `soil_data`, `alerts`, `alert_thresholds`, `recommendations`, `reminders`
    - Definir políticas `SELECT/INSERT/UPDATE/DELETE` en cada tabla multi-tenant filtrando por `tenant_id = auth.tenant_id()`
    - Política `UPDATE` con `WITH CHECK (tenant_id = auth.tenant_id())` para impedir cambiar `tenant_id`
    - Política pública de SELECT en `crop_parameters` (sin INSERT/UPDATE/DELETE → solo `service_role` escribe)
    - Aplicar migraciones con `supabase db push`
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 2.3 Implementar repositorio base con tenant scope (defensa en profundidad)
    - Crear `src/lib/repositories/base.repository.ts` con clase abstracta `TenantScopedRepository`
    - Aceptar en el constructor: `SupabaseClient`, `tenantId`, `tableName`
    - Implementar método `scoped()` que devuelve query con `.eq('tenant_id', this.tenantId)` aplicado
    - Implementar `verifyOwnership(resourceId)` que retorna `true` si el recurso pertenece al tenant
    - Asegurar que las operaciones UPDATE nunca incluyan `tenant_id` en el payload (inmutabilidad)
    - Lanzar `TenantAccessError` cuando una operación no resuelve un tenant válido
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.4 Escribir property test para aislamiento de datos por tenant
    - **Property 1: Aislamiento de datos por tenant**
    - **Valida: Requisitos 1.3, 1.6, 2.2, 6.5, 9.2, 9.5**

  - [ ]* 2.5 Escribir property test para rechazo de operaciones sin tenant válido
    - **Property 2: Rechazo de operaciones sin tenant válido**
    - **Valida: Requisitos 9.3**

  - [ ]* 2.6 Escribir property test para inmutabilidad de tenant_id
    - **Property 3: Inmutabilidad de tenant_id**
    - **Valida: Requisitos 9.4**

  - [x] 2.7 Implementar repositorios específicos sobre cliente Supabase
    - Crear `src/lib/repositories/parcela.repository.ts` con: `create`, `findAll`, `findById`, `update`, `softDelete`
    - Crear `src/lib/repositories/cultivo.repository.ts` con: `create`, `findByParcela`, `updateStatus`
    - Crear `src/lib/repositories/climate.repository.ts` con: `create`, `findLatest`
    - Crear `src/lib/repositories/soil.repository.ts` con: `create`, `findByParcela` (paginado), `findLatest`
    - Crear `src/lib/repositories/alert.repository.ts` con: `create`, `findByTenant`, `markAsRead`, `findRecentAlert`, `incrementGroupedAlert`
    - Crear `src/lib/repositories/recommendation.repository.ts` con: `findCachedFor`, `upsert`, `markStale`, `listByTenant`
    - Crear `src/lib/repositories/reminder.repository.ts` con: `create`, `update`, `findByTenant`, `markCompleted`, `promoteUpcoming`, `delete`
    - Todos los repositorios extienden `TenantScopedRepository` excepto `crop_parameters` (acceso directo al cliente Supabase)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 5.2, 6.1, 6.2, 7.4, 7.5, 10.1, 10.6, 11.1, 11.6_

- [x] 3. Autenticación con Supabase Auth y middleware
  - [x] 3.1 Implementar rutas de autenticación delegadas a Supabase Auth
    - Crear `src/app/api/auth/register/route.ts` (POST):
      - Llama `supabase.auth.signUp({ email, password })`
      - Crea `tenant` y `user_profile` (id = `auth.users.id`) usando cliente `service_role`
      - Actualiza `app_metadata` del usuario con `{ tenant_id }` para que el JWT lo incluya
    - Crear `src/app/api/auth/login/route.ts` (POST): `supabase.auth.signInWithPassword({ email, password })`
    - Crear `src/app/api/auth/logout/route.ts` (POST): `supabase.auth.signOut()` y limpia cookies vía `@supabase/ssr`
    - Validar inputs con Zod
    - Normalizar errores de Supabase Auth al formato `{ error, code: 'AUTH_FAILED' }` sin revelar si el email existe
    - _Requisitos: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.2 Implementar middleware de tenant context (Supabase session)
    - Crear `src/lib/middleware/auth.ts` con función que llama `supabase.auth.getUser()` y retorna sesión
    - Crear `src/lib/middleware/tenant-filter.ts` con función `withTenantContext(req, handler)`:
      - Resuelve `tenantId` desde `user.app_metadata.tenant_id` con fallback a `user_profiles`
      - Retorna 401 si no hay sesión, 403 si no se resuelve `tenant_id`, registrando incidente
      - Pasa `{ userId, tenantId, supabase }` al handler
    - Configurar `middleware.ts` raíz para proteger rutas `/dashboard/*` y APIs autenticadas (redirigir a `/login` si la sesión es inválida)
    - _Requisitos: 1.3, 1.5, 1.6, 9.2, 9.3_

  - [ ]* 3.3 Escribir property test para credenciales inválidas
    - **Property 4: Credenciales inválidas no revelan información**
    - **Valida: Requisitos 1.2**

  - [ ]* 3.4 Escribir property test para autenticación válida
    - **Property 21: Autenticación válida genera token**
    - **Valida: Requisitos 1.1**

- [x] 4. Checkpoint - Verificar infraestructura base
  - Asegurar que las migraciones Supabase y RLS funcionan, y que las pruebas de la capa de datos pasan. Preguntar al usuario si surgen dudas.

- [x] 5. Servicios de negocio - Parcelas
  - [x] 5.1 Implementar servicio de parcelas
    - Crear `src/lib/services/parcela.service.ts`
    - Creación con validación de campos obligatorios (nombre, ubicación, superficie)
    - Validación de unicidad de nombre dentro del tenant (manejar `unique_violation` de PG)
    - Edición con actualización de `updated_at`
    - Soft-delete: marca `is_active = false` preservando datos históricos
    - Listado filtrado por tenant con solo parcelas activas por defecto
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 5.2 Escribir property tests para parcelas
    - **Property 5: Creación de parcela persiste todos los campos requeridos**
    - **Property 6: Unicidad de nombre de parcela por tenant**
    - **Property 7: Soft-delete preserva datos históricos**
    - **Property 8: Validación de campos obligatorios reporta campos faltantes**
    - **Property 9: Edición de parcela actualiza timestamp**
    - **Valida: Requisitos 2.1, 2.3, 2.4, 2.5, 2.6**

- [x] 6. Servicios de negocio - Cultivos
  - [x] 6.1 Implementar servicio de cultivos
    - Crear `src/lib/services/cultivo.service.ts`
    - Creación de cultivo asociado a parcela válida del tenant (validar ownership con `verifyOwnership`)
    - Listado por parcela ordenado por `planting_date` DESC
    - Cambio de estado (active → harvested, active → lost) registrando `status_changed_at`
    - Permitir múltiples cultivos por parcela en distintos ciclos productivos
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.2 Escribir property tests para cultivos
    - **Property 10: Cultivo requiere parcela válida del tenant**
    - **Property 11: Ordenamiento descendente por fecha**
    - **Property 12: Cambio de estado de cultivo registra fecha**
    - **Valida: Requisitos 3.2, 3.3, 3.5**

- [x] 7. Servicios de negocio - Datos de suelo
  - [x] 7.1 Implementar servicio de datos de suelo
    - Crear `src/lib/services/soil.service.ts`
    - Registro con validación de rangos (pH 0-14, humedad 0-100%) — Zod + CHECK en BD
    - Consulta de historial ordenado por `measurement_date` DESC con paginación (`limit`, `offset`)
    - Validar que la parcela pertenezca al tenant antes de registrar
    - Mensajes de error indican rangos permitidos
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Escribir property tests para datos de suelo
    - **Property 14: Validación de rangos de datos de suelo**
    - **Property 15: Persistencia completa de datos de suelo**
    - **Valida: Requisitos 6.1, 6.3, 6.4**

- [ ] 8. Servicios de negocio - Datos climáticos (Open-Meteo + fallback)
  - [x] 8.1 Implementar cliente de API climática con Open-Meteo primario
    - Crear `src/lib/utils/climate-api.ts` con función `fetchClimateData(lat, lon)`
    - Provider primario **Open-Meteo** (sin API key): URL `https://api.open-meteo.com/v1/forecast` con parámetros `current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability`, `hourly=temperature_2m,relative_humidity_2m,precipitation_probability`, `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`, `forecast_days=3`, `timezone=auto`
    - Fallback opcional **OpenWeatherMap** (`OPENWEATHER_API_KEY`) con conversión de unidades (m/s → km/h, pop 0-1 → 0-100%)
    - Selección de provider vía `CLIMATE_API_PROVIDER` (default `open-meteo`)
    - Timeout de 10 segundos con `AbortSignal.timeout(10000)`; retorna `null` si ambos fallan
    - Documentar URL y parámetros en JSDoc del módulo
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2_

  - [x] 8.2 Implementar servicio de clima con flag `isStale`
    - Crear `src/lib/services/climate.service.ts` con `updateClimateForAllParcelas` (usado por cron) y `getLatestForParcela`
    - Almacenar datos en unidades métricas (°C, km/h, mm, %) asociados a la ubicación de cada parcela
    - Implementar flag `isStale` cuando se retornan los últimos datos válidos por fallo de API
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.3 Escribir property test para persistencia de datos climáticos
    - **Property 20: Persistencia de datos climáticos válidos**
    - **Valida: Requisitos 5.2, 5.4, 5.5**

- [ ] 9. Servicios de negocio - Sistema de alertas
  - [x] 9.1 Implementar motor de evaluación de alertas
    - Crear `src/lib/utils/alert-engine.ts` con `evaluateAlerts` y `mergeThresholds`
    - Umbrales predeterminados: `temp_min=0°C`, `temp_max=40°C`, `soil_humidity_min=20%`, `precipitation>80%`
    - Lógica de merge: umbrales personalizados reemplazan predeterminados por parcela
    - _Requisitos: 7.1, 7.2, 7.3_

  - [x] 9.2 Implementar servicio de alertas con consolidación
    - Crear `src/lib/services/alert.service.ts`
    - Implementar `processAlertTrigger` con ventana de agrupamiento de 60 minutos (incrementa `grouped_count` en lugar de crear nueva alerta)
    - Marcado de alerta como leída actualiza `status='read'` y `read_at`
    - Configuración de umbrales personalizados por parcela
    - _Requisitos: 7.4, 7.5, 7.6_

  - [ ]* 9.3 Escribir property tests para alertas
    - **Property 16: Generación de alertas al superar umbral**
    - **Property 17: Umbrales personalizados reemplazan predeterminados**
    - **Property 18: Alerta marcada como leída no es pendiente**
    - **Property 19: Consolidación de alertas en ventana de 60 minutos**
    - **Valida: Requisitos 7.1, 7.3, 7.5, 7.6**

- [ ] 10. Servicios de negocio - Recomendaciones agronómicas
  - [x] 10.1 Crear seed de `crop_parameters` con cultivos comunes Chile/Latam
    - Crear `supabase/seed.sql` (o migración `0007_seed_crop_parameters.sql`) que inserta filas para: **uva**, **palta**, **manzana**, **tomate**, **lechuga**, **papa**, **trigo**, **maíz**, **cereza**, **arándano**, **frambuesa**, **kiwi**, **durazno/nectarín**, **ciruela**, **poroto (frijol)**, **cebolla**, **ajo**, **zapallo**, **pimiento/ají**, **choclo (maíz dulce)**, **remolacha**, **zanahoria**, **espinaca**, **acelga**, **alcachofa**, **espárrago**, **avena**, **cebada**, **raps (canola)**
    - Cada fila incluye: `temp_min_germinacion`, `temp_max_germinacion`, `temp_optima_min/max`, `dias_a_cosecha`, `hemisferio_sur_meses_siembra`, `hemisferio_norte_meses_siembra`, `ventana_poda_meses` (cuando aplica), `calendario_fertilizacion` (JSONB con DAP), `humedad_suelo_optima_min/max`
    - Ejecutar con `supabase db reset` (local) o aplicar manualmente al proyecto remoto
    - _Requisitos: 10.1, 10.2, 10.7_

  - [x] 10.2 Implementar motor de recomendaciones (`recommendation-engine.ts`)
    - Crear `src/lib/utils/recommendation-engine.ts` (módulo puro, sin I/O)
    - `generateSiembraRecommendation(input)`: selecciona ventana de meses según `parcela.latitude < 0` (hemisferio sur) y construye `windowStart`, `windowEnd`, `reasoning`, `climateSnapshot`
    - `generateCosechaRecommendation(input)`: calcula `estimatedHarvestDate = plantingDate + dias_a_cosecha`, ventana ±7 días según condiciones climáticas registradas
    - Helper `computeWindowFromMonths(months, now)` que mapea meses a fechas concretas del año vigente
    - Helper `buildReasoning({ hemisphere, months, climate, species })`
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

  - [x] 10.3 Implementar `recommendation.service.ts`
    - Crear `src/lib/services/recommendation.service.ts`
    - Función `getOrGenerateRecommendation(parcelaId, cultivoId, type)`:
      - Busca cache vigente (`expires_at > now()`); si existe y la API climática responde correctamente, retorna cache; si la API falla, retorna cache con `isStale=true` (Property 26)
      - Si no hay cache: obtiene `crop_parameters(species, variety)` con fallback a `(species, null)`; si no existe, lanza error 422 `CROP_PARAMETERS_NOT_FOUND`
      - Combina parcela + cultivo + climate + cropParams en el motor; persiste con `expires_at = now() + 24h`
    - Función `refreshAllForActiveCultivos()` (usada por cron diario)
    - _Requisitos: 10.1, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 10.4 Escribir property tests para recomendaciones
    - **Property 22: Generación de recomendación con datos completos**
    - **Property 23: Ajuste por hemisferio sur**
    - **Property 24: Rango de siembra es válido**
    - **Property 25: Fecha de cosecha estimada es posterior a siembra**
    - **Property 26: Fail-safe de recomendación con datos cacheados**
    - **Property 27: Especies sin parámetros retornan error informativo**
    - **Valida: Requisitos 10.1, 10.2, 10.3, 10.4, 10.5, 10.7**

- [ ] 11. Servicios de negocio - Recordatorios de tareas agrícolas
  - [x] 11.1 Implementar motor de recordatorios (`reminder-engine.ts`)
    - Crear `src/lib/utils/reminder-engine.ts` (módulo puro)
    - `computeIrrigationDate({ lastSoilHumidityPercent, forecastPrecipitation72hMm, optimalHumidityMin, now })`: cuanto mayor el déficit hídrico, más cercana la fecha sugerida (Property 29)
    - `computePruningDate(cultivo, cropParams, parcela, now)`: usa `ventana_poda_meses` ajustada por hemisferio; retorna el próximo mes en la ventana ≥ `now`
    - `computeFertilizationDate(cultivo, cropParams, lastSoil, now)`: cruza `calendario_fertilizacion` (DAP) con N/P/K más bajos del último `soil_data` (Property 31)
    - `nextMonthInWindow(months, now)` helper
    - _Requisitos: 11.2, 11.3, 11.4_

  - [x] 11.2 Implementar `reminder.service.ts`
    - Crear `src/lib/services/reminder.service.ts`
    - `createManualReminder(input)`: valida ownership de parcela y cultivo del tenant (Property 28); rechaza si pertenecen a otro tenant (Requirement 11.9)
    - `generateAutoReminders()`: itera parcelas/cultivos activos, llama a los `compute*Date` del motor y crea recordatorios `source='auto'`; evita duplicar (no crear si ya existe uno pendiente del mismo tipo y cultivo)
    - `markCompleted(id)`: actualiza `status='completed'` y `completed_at = now()` (Property 33)
    - `promoteUpcoming()`: actualiza a `status='upcoming'` los recordatorios `pending` con `scheduled_at - now() < 24h` (Property 34)
    - `listForTenant(filters)`: ordena por `scheduled_at` ASC para `pending`/`upcoming` (Property 32)
    - _Requisitos: 11.1, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [ ]* 11.3 Escribir property tests para recordatorios
    - **Property 28: Round-trip de creación de recordatorio**
    - **Property 29: Recordatorio de riego responde a déficit hídrico**
    - **Property 30: Recordatorio de poda dentro de ventana del cultivo**
    - **Property 31: Recordatorio de fertilización responde a déficit de nutrientes**
    - **Property 32: Listado de pendientes ordenado ascendentemente**
    - **Property 33: Completar recordatorio actualiza estado y excluye de pendientes**
    - **Property 34: Marcado "próximo" cuando faltan menos de 24 horas**
    - **Valida: Requisitos 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**

- [x] 12. Manejo de errores y utilidades transversales
  - [x] 12.1 Implementar sistema de errores y respuestas estandarizadas
    - Crear `src/lib/utils/errors.ts` con: `AppError`, `ValidationError`, `TenantAccessError`, `ResourceNotFoundError`, `CropParametersNotFoundError` (422)
    - Helper `toErrorResponse(error)` que convierte a `{ error, code, fields? }` para Route Handlers
    - Asegurar que errores de autenticación retornan mensajes genéricos
    - Logging estructurado de incidentes de seguridad (`[SECURITY] ...`)
    - _Requisitos: 1.2, 9.3, 10.7_

  - [x] 12.2 Implementar `usage-logger.ts` para servicios externos
    - Crear `src/lib/utils/usage-logger.ts` con `logExternalCall(provider, ok, latencyMs)`
    - Salida JSON estructurada en `console.log` con `type: 'external_call'`, `provider`, `ok`, `latencyMs`, `timestamp`
    - Helper `logLimitWarning(provider, detail)` que emite eventos `LIMIT_WARNING`
    - Integrar en `climate-api.ts` (Open-Meteo, OpenWeatherMap) y en cron jobs
    - _Requisitos: 12.5, 12.6_

- [x] 13. Checkpoint - Verificar servicios de negocio
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [ ] 14. API Routes
  - [ ] 14.1 Implementar rutas de parcelas
    - Crear `src/app/api/parcelas/route.ts` (GET, POST) — listar y crear
    - Crear `src/app/api/parcelas/[id]/route.ts` (GET, PUT, DELETE) — detalle, editar, soft-delete
    - Aplicar `withTenantContext` y validación Zod en todas las rutas
    - Retornar errores descriptivos con campos faltantes
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 14.2 Implementar rutas de cultivos
    - Crear `src/app/api/parcelas/[parcelaId]/cultivos/route.ts` (GET, POST)
    - Crear `src/app/api/cultivos/[id]/status/route.ts` (PATCH)
    - Validar ownership de parcela antes de crear cultivo
    - _Requisitos: 3.1, 3.2, 3.3, 3.5_

  - [ ] 14.3 Implementar rutas de datos de suelo y clima
    - Crear `src/app/api/parcelas/[parcelaId]/soil/route.ts` (GET con `?limit&offset`, POST)
    - Crear `src/app/api/parcelas/[parcelaId]/climate/route.ts` (GET con flag `isStale`)
    - _Requisitos: 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 14.4 Implementar rutas de alertas, umbrales y dashboard
    - Crear `src/app/api/alerts/route.ts` (GET con filtros) y `src/app/api/alerts/[id]/read/route.ts` (PATCH)
    - Crear `src/app/api/parcelas/[parcelaId]/thresholds/route.ts` (GET, PUT)
    - Crear `src/app/api/dashboard/route.ts` (GET) — resumen con conteos, parcelas con clima y última recomendación, alertas recientes y `upcomingReminders`
    - Crear `src/app/api/dashboard/parcela/[id]/route.ts` (GET) — detalle de parcela
    - _Requisitos: 4.1, 4.2, 4.4, 7.4, 7.5, 11.5_

  - [ ] 14.5 Implementar rutas de recomendaciones
    - Crear `src/app/api/parcelas/[parcelaId]/recommendations/route.ts` (GET con `?type=siembra|cosecha&cultivoId=...`)
    - Crear `src/app/api/parcelas/[parcelaId]/recommendations/refresh/route.ts` (POST) — fuerza regeneración
    - Retornar 422 con `code: 'CROP_PARAMETERS_NOT_FOUND'` cuando especie/variedad no tiene parámetros
    - Aplicar `withTenantContext` y validación Zod
    - _Requisitos: 10.1, 10.5, 10.6, 10.7, 10.8_

  - [ ] 14.6 Implementar rutas de recordatorios
    - Crear `src/app/api/reminders/route.ts` (GET con filtros `?status&parcelaId&from&to`, POST)
    - Crear `src/app/api/reminders/[id]/route.ts` (PATCH para editar `scheduledAt`/`status`, DELETE solo para `source='manual'`)
    - Crear `src/app/api/reminders/[id]/complete/route.ts` (PATCH) — marcar completado
    - Aplicar `withTenantContext`, validación Zod y verificación de ownership
    - _Requisitos: 11.1, 11.5, 11.6, 11.7, 11.9, 11.10_

- [ ] 15. Cron jobs en Vercel
  - [ ] 15.1 Configurar `vercel.json` con Vercel Cron
    - Crear `vercel.json` en la raíz del proyecto con array `crons`:
      - `/api/cron/climate` schedule `0 * * * *` (cada hora)
      - `/api/cron/recommendations` schedule `0 3 * * *` (cada 24h, 03:00 UTC)
      - `/api/cron/reminders` schedule `0 * * * *` (cada hora)
    - Documentar en README la configuración de `CRON_SECRET` en Vercel Dashboard
    - _Requisitos: 5.1, 10.6, 11.8, 12.3_

  - [ ] 15.2 Implementar endpoint cron de actualización climática
    - Crear `src/app/api/cron/climate/route.ts` (GET o POST según convención Vercel Cron)
    - Validar header `Authorization: Bearer ${CRON_SECRET}` antes de ejecutar; retornar 401 si no coincide
    - Usar cliente `service_role` para iterar todas las parcelas activas (bypass RLS)
    - Por cada parcela: llamar `fetchClimateData`, persistir en `climate_data`, evaluar alertas con `processAlertTrigger`
    - Implementar chunking si el número de parcelas requiere más de ~8 segundos (Vercel timeout 10 s)
    - Loguear cada llamada con `usage-logger`
    - _Requisitos: 5.1, 5.2, 5.3, 7.1, 12.6_

  - [ ] 15.3 Implementar endpoint cron de recomendaciones
    - Crear `src/app/api/cron/recommendations/route.ts`
    - Validar `CRON_SECRET`
    - Iterar tenants → parcelas activas → cultivos activos; llamar `recommendation.service.refreshAllForActiveCultivos()`
    - Si `crop_parameters` falta para una `(species, variety)`, omitir y loguear (no error)
    - _Requisitos: 10.6, 10.7_

  - [ ] 15.4 Implementar endpoint cron de recordatorios
    - Crear `src/app/api/cron/reminders/route.ts`
    - Validar `CRON_SECRET`
    - Ejecutar `reminder.service.promoteUpcoming()` (promueve `pending → upcoming` cuando `scheduled_at - now() < 24h`)
    - Ejecutar `reminder.service.generateAutoReminders()` para crear recordatorios automáticos faltantes
    - _Requisitos: 11.2, 11.3, 11.4, 11.8_

- [ ] 16. Checkpoint - Verificar API y cron jobs
  - Asegurar que todas las pruebas pasan, validar las rutas cron localmente con `vercel dev` o curl con `CRON_SECRET`. Preguntar al usuario si surgen dudas.

- [ ] 17. Componentes de UI - Layout, navegación y autenticación
  - [ ] 17.1 Implementar layout principal y navegación mobile-first
    - Crear `src/components/ui/MobileNav.tsx` — menú hamburguesa colapsable en < 768px
    - Crear `src/app/(dashboard)/layout.tsx` con sidebar en desktop y nav colapsable en móvil
    - Implementar touch targets mínimos de 44x44px y tipografía mínima 16px en móvil
    - Configurar breakpoints: 320px (móvil), 768px (tablet), 1024px (desktop)
    - _Requisitos: 8.1, 8.2, 8.3, 8.5_

  - [ ] 17.2 Implementar páginas de autenticación
    - Crear `src/app/(auth)/login/page.tsx` con formulario responsivo que llama `/api/auth/login`
    - Crear `src/app/(auth)/register/page.tsx` con formulario que llama `/api/auth/register`
    - Validación inline y mensajes de error sin revelar información sensible
    - Redirección post-login al dashboard usando router de Next.js
    - _Requisitos: 1.1, 1.2, 1.4, 1.5_

- [ ] 18. Componentes de UI - Dashboard y parcelas
  - [ ] 18.1 Implementar dashboard principal
    - Crear `src/app/(dashboard)/page.tsx` como página principal
    - Crear `src/components/dashboard/DashboardSummary.tsx` — contadores de parcelas, cultivos, alertas, recordatorios próximos
    - Crear `src/components/dashboard/ParcelaCard.tsx` — info + datos climáticos + última recomendación
    - Crear `src/components/dashboard/AlertBanner.tsx` — banner de alertas pendientes
    - Crear `src/components/dashboard/RemindersBanner.tsx` — destaca recordatorios `upcoming` (< 24h)
    - Layout responsivo con CSS Grid: `repeat(auto-fit, minmax(300px, 1fr))`
    - Optimizar para carga ≤ 3s en 3G
    - _Requisitos: 4.1, 4.2, 4.3, 4.5, 8.1, 11.5, 11.8_

  - [ ]* 18.2 Escribir property test para conteos del dashboard
    - **Property 13: Dashboard refleja conteos reales**
    - **Valida: Requisitos 4.1**

  - [ ] 18.3 Implementar páginas de gestión de parcelas
    - Crear `src/app/(dashboard)/parcelas/page.tsx` — lista con búsqueda
    - Crear `src/app/(dashboard)/parcelas/new/page.tsx` — formulario de creación
    - Crear `src/app/(dashboard)/parcelas/[id]/page.tsx` — detalle con cultivos y suelo
    - Crear `src/components/parcelas/ParcelaForm.tsx` con validación inline
    - Crear `src/components/parcelas/ParcelaList.tsx` con filtros
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.4_

- [ ] 19. Componentes de UI - Cultivos, suelo y alertas
  - [ ] 19.1 Implementar páginas de cultivos y datos de suelo
    - Crear `src/app/(dashboard)/cultivos/[parcelaId]/page.tsx` — lista de cultivos por parcela
    - Crear `src/components/cultivos/CultivoTimeline.tsx` — timeline visual del ciclo
    - Crear `src/app/(dashboard)/suelo/[parcelaId]/page.tsx` — historial paginado
    - Crear `src/components/soil/SoilDataChart.tsx` — gráfico de evolución de pH/humedad/N/P/K
    - Formularios de registro con validación de rangos
    - _Requisitos: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

  - [ ] 19.2 Implementar página de alertas
    - Crear `src/app/(dashboard)/alertas/page.tsx` con filtros por tipo y estado
    - Crear `src/components/alerts/AlertList.tsx` con acción "marcar como leída"
    - UI de configuración de umbrales personalizados por parcela
    - Mostrar contador de ocurrencias agrupadas (`grouped_count`)
    - _Requisitos: 7.1, 7.3, 7.4, 7.5, 7.6_

- [ ] 20. Componentes de UI - Recomendaciones y recordatorios
  - [ ] 20.1 Implementar página y componente de recomendaciones
    - Crear `src/app/(dashboard)/recomendaciones/[parcelaId]/page.tsx` — recomendaciones por cultivo
    - Crear `src/components/recommendations/RecommendationCard.tsx` — tarjeta con tipo (siembra/cosecha), ventana óptima, `reasoning`, snapshot climático y badge `isStale` cuando aplica
    - Botón "Refrescar" que llama `/api/parcelas/[parcelaId]/recommendations/refresh`
    - Manejar caso 422 (`CROP_PARAMETERS_NOT_FOUND`) con mensaje informativo
    - _Requisitos: 10.1, 10.3, 10.4, 10.5, 10.7, 10.8_

  - [ ] 20.2 Implementar página y componentes de recordatorios
    - Crear `src/app/(dashboard)/recordatorios/page.tsx` con filtros por estado, tipo y rango de fechas
    - Crear `src/components/reminders/ReminderList.tsx` — lista ordenada ASC con acción "Completar"
    - Crear `src/components/reminders/ReminderForm.tsx` — alta/edición manual (`source='manual'`)
    - Mostrar `reasoning` del cálculo cuando `source='auto'`
    - Integrar `RemindersBanner.tsx` en el dashboard mostrando recordatorios `upcoming`
    - _Requisitos: 11.1, 11.5, 11.6, 11.7, 11.8, 11.10_

- [ ] 21. Checkpoint final - Verificación completa
  - Asegurar que todas las pruebas pasan, validar manualmente flujos críticos (registro, creación de parcela, generación de recomendación, completar recordatorio). Preguntar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud (1-34)
- Los unit tests validan ejemplos específicos y casos borde
- Stack: TypeScript + Next.js App Router, Supabase (PostgreSQL + Auth + RLS), Vercel (Free Tier) con Vercel Cron, Open-Meteo (sin API key) con fallback opcional a OpenWeatherMap, Zod para validación
- Aislamiento multi-tenant en dos capas: filtrado a nivel de aplicación + políticas RLS de Supabase
- Toda la API y los crons corren como Vercel Functions (timeout 10 s); chunking obligatorio si crece la cantidad de parcelas
- `service_role` key solo se usa server-side (cron, registro inicial); nunca se prefija con `NEXT_PUBLIC_`
- La interfaz sigue un enfoque mobile-first con breakpoints en 320px, 768px y 1024px

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "12.1", "12.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["2.4", "2.5", "2.6", "2.7", "3.2", "3.3", "3.4"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1", "10.1"] },
    { "id": 6, "tasks": ["5.2", "6.2", "7.2", "8.2", "9.2", "10.2", "11.1"] },
    { "id": 7, "tasks": ["8.3", "9.3", "10.3", "11.2"] },
    { "id": 8, "tasks": ["10.4", "11.3", "14.1", "14.2", "14.3", "14.4", "14.5", "14.6"] },
    { "id": 9, "tasks": ["15.1"] },
    { "id": 10, "tasks": ["15.2", "15.3", "15.4"] },
    { "id": 11, "tasks": ["17.1", "17.2"] },
    { "id": 12, "tasks": ["18.1", "18.3", "19.1", "19.2", "20.1", "20.2"] },
    { "id": 13, "tasks": ["18.2"] }
  ]
}
```
