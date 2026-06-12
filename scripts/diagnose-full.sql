-- =====================================================
-- DIAGNÓSTICO COMPLETO DE MERCADO PAGO Y SUSCRIPCIONES
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para ver el estado completo

-- =====================================================
-- 1. VERIFICAR PLANES CONFIGURADOS
-- =====================================================
SELECT '=== PLANES DISPONIBLES ===' as seccion;
SELECT 
  id as plan_id,
  name as plan_name,
  price_clp,
  max_plots,
  max_crops,
  max_reminders,
  allow_workers,
  created_at
FROM plans 
ORDER BY price_clp;

-- =====================================================
-- 2. VERIFICAR TENANTS Y SUS SUSCRIPCIONES ACTUALES
-- =====================================================
SELECT '=== TENANTS Y SUSCRIPCIONES ===' as seccion;
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.created_at as tenant_created,
  s.id as subscription_id,
  s.plan_id,
  p.name as plan_name,
  p.price_clp,
  s.status as subscription_status,
  s.start_date,
  s.end_date,
  s.mp_preapproval_id,
  s.next_billing_date,
  s.cancelled_at
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id AND s.status = 'active'
LEFT JOIN plans p ON p.id = s.plan_id
ORDER BY t.created_at DESC;

-- =====================================================
-- 3. VERIFICAR USUARIOS Y SUS EMAILS
-- =====================================================
SELECT '=== USUARIOS REGISTRADOS ===' as seccion;
SELECT 
  t.name as tenant_name,
  au.email,
  au.created_at as user_created,
  up.role,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM tenants t
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY au.created_at DESC;

-- =====================================================
-- 4. LOGS DE PAGO (Últimos 20)
-- =====================================================
SELECT '=== LOGS DE MERCADO PAGO ===' as seccion;
SELECT 
  id,
  event_type,
  tenant_id,
  details,
  created_at
FROM payment_logs
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- 5. SUSCRIPCIONES PENDIENTES O PROBLEMÁTICAS
-- =====================================================
SELECT '=== SUSCRIPCIONES PROBLEMÁTICAS ===' as seccion;
SELECT 
  s.id,
  t.name as tenant_name,
  au.email,
  s.plan_id,
  s.status,
  s.mp_preapproval_id,
  s.created_at,
  CASE 
    WHEN s.mp_preapproval_id IS NULL AND s.plan_id != 'free' THEN '❌ Falta PreApproval ID'
    WHEN s.status = 'pending' THEN '⏳ Pago pendiente'
    WHEN s.status = 'cancelled' THEN '🚫 Cancelada'
    WHEN s.status = 'expired' THEN '⌛ Expirada'
    ELSE '✅ OK'
  END as diagnostico
FROM subscriptions s
LEFT JOIN tenants t ON t.id = s.tenant_id
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = up.id
WHERE s.mp_preapproval_id IS NULL AND s.plan_id != 'free'
   OR s.status IN ('pending', 'cancelled', 'expired')
ORDER BY s.created_at DESC;

-- =====================================================
-- 6. RESUMEN DE USO POR TENANT (Verificar límites)
-- =====================================================
SELECT '=== USO DE RECURSOS POR TENANT ===' as seccion;
SELECT 
  t.name as tenant_name,
  p.name as plan_name,
  p.max_plots as limite_parcelas,
  COUNT(DISTINCT pa.id) as parcelas_usadas,
  p.max_crops as limite_cultivos,
  COUNT(DISTINCT c.id) as cultivos_usados,
  CASE 
    WHEN COUNT(DISTINCT pa.id) >= p.max_plots THEN '⚠️ Límite alcanzado'
    ELSE '✅ OK'
  END as estado_parcelas,
  CASE 
    WHEN COUNT(DISTINCT c.id) >= p.max_crops THEN '⚠️ Límite alcanzado'
    ELSE '✅ OK'
  END as estado_cultivos
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id AND s.status = 'active'
LEFT JOIN plans p ON p.id = COALESCE(s.plan_id, 'free')
LEFT JOIN parcelas pa ON pa.tenant_id = t.id AND pa.is_active = true
LEFT JOIN cultivos c ON c.tenant_id = t.id AND c.is_active = true
GROUP BY t.id, t.name, p.name, p.max_plots, p.max_crops
ORDER BY t.created_at DESC;

-- =====================================================
-- 7. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================
SELECT '=== VERIFICACIÓN DE ESTRUCTURA ===' as seccion;
SELECT 
  'subscriptions' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
  AND column_name IN ('mp_preapproval_id', 'next_billing_date', 'cancelled_at')
ORDER BY ordinal_position;

-- =====================================================
-- 8. USUARIOS DE PRUEBA DE MERCADO PAGO
-- =====================================================
SELECT '=== POSIBLES USUARIOS DE PRUEBA ===' as seccion;
SELECT 
  au.email,
  t.name as tenant_name,
  au.created_at,
  CASE 
    WHEN au.email LIKE '%testuser%' THEN '✅ Usuario de prueba MP'
    WHEN au.email LIKE '%test_%' THEN '🤔 Posible usuario de prueba'
    ELSE '❌ Usuario regular (no de prueba MP)'
  END as tipo_usuario
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
LEFT JOIN tenants t ON t.id = up.tenant_id
ORDER BY au.created_at DESC
LIMIT 10;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT '=== RESUMEN ===' as seccion;
SELECT 
  (SELECT COUNT(*) FROM tenants) as total_tenants,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free') as planes_free,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'pro') as planes_pro,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'organizacion') as planes_institucional,
  (SELECT COUNT(*) FROM payment_logs WHERE event_type = 'initiated') as pagos_iniciados,
  (SELECT COUNT(*) FROM payment_logs WHERE event_type = 'preapproval_processed') as pagos_completados,
  (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%testuser%') as usuarios_prueba_mp;
