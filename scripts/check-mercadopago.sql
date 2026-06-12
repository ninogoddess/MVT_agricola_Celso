-- Script de diagnóstico para Mercado Pago
-- Ejecuta esto en tu Supabase SQL Editor

-- 1. Verificar planes configurados
SELECT id, name, price_clp, max_plots, max_crops, max_reminders 
FROM plans 
ORDER BY price_clp;

-- 2. Ver todas las suscripciones (debería haber una 'free' por tenant)
SELECT 
  s.id,
  s.tenant_id,
  s.plan_id,
  s.status,
  s.start_date,
  s.end_date,
  s.mp_preapproval_id,
  p.name as plan_name,
  p.price_clp
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC;

-- 3. Ver logs de pago (para ver qué está pasando con Mercado Pago)
SELECT 
  event_type,
  tenant_id,
  details,
  created_at
FROM payment_logs
ORDER BY created_at DESC
LIMIT 20;

-- 4. Ver tenants y sus usuarios
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  au.email,
  up.role
FROM tenants t
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY t.created_at DESC;

-- 5. Ver suscripciones sin mp_preapproval_id (no completadas)
SELECT 
  s.*,
  t.name as tenant_name
FROM subscriptions s
LEFT JOIN tenants t ON t.id = s.tenant_id
WHERE s.mp_preapproval_id IS NULL
AND s.plan_id != 'free';
