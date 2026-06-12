# Script de verificación rápida de Mercado Pago (PowerShell)
# Ejecutar con: powershell -ExecutionPolicy Bypass -File scripts/verify-setup.ps1

Write-Host "[VERIFICACION] Configuracion de Mercado Pago" -ForegroundColor Cyan
Write-Host ""

# Verificar .env.local
if (Test-Path ".env.local") {
    Write-Host "[OK] Archivo .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se encontro .env.local" -ForegroundColor Red
    exit 1
}

# Leer contenido del archivo
$envContent = Get-Content ".env.local" -Raw

# Verificar credenciales MP
Write-Host ""
Write-Host "[CREDENCIALES] Verificando Mercado Pago..." -ForegroundColor Cyan

if ($envContent -match "MERCADOPAGO_ACCESS_TOKEN=TEST-") {
    Write-Host "[OK] MERCADOPAGO_ACCESS_TOKEN configurado (TEST)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] MERCADOPAGO_ACCESS_TOKEN no encontrado o no es TEST" -ForegroundColor Red
}

if ($envContent -match "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-") {
    Write-Host "[OK] NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY configurado (TEST)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no encontrado o no es TEST" -ForegroundColor Red
}

if ($envContent -match "NEXT_PUBLIC_SITE_URL=") {
    Write-Host "[OK] NEXT_PUBLIC_SITE_URL configurado" -ForegroundColor Green
} else {
    Write-Host "[WARN] NEXT_PUBLIC_SITE_URL no encontrado" -ForegroundColor Yellow
}

# Verificar migraciones
Write-Host ""
Write-Host "[MIGRACIONES] Verificando archivos SQL..." -ForegroundColor Cyan

if (Test-Path "supabase\migrations\0011_subscriptions_and_plans.sql") {
    Write-Host "[OK] 0011_subscriptions_and_plans.sql" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falta migracion de planes" -ForegroundColor Red
}

if (Test-Path "supabase\migrations\0013_subscription_details.sql") {
    Write-Host "[OK] 0013_subscription_details.sql" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falta migracion de detalles de suscripcion" -ForegroundColor Red
}

if (Test-Path "supabase\migrations\0014_fix_plan_prices.sql") {
    Write-Host "[OK] 0014_fix_plan_prices.sql" -ForegroundColor Green
} else {
    Write-Host "[WARN] Falta migracion de precios" -ForegroundColor Yellow
}

# Verificar archivos clave
Write-Host ""
Write-Host "[INTEGRACION] Verificando archivos de codigo..." -ForegroundColor Cyan

if (Test-Path "src\lib\services\payment.service.ts") {
    Write-Host "[OK] payment.service.ts" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falta payment.service.ts" -ForegroundColor Red
}

if (Test-Path "src\app\api\checkout\route.ts") {
    Write-Host "[OK] checkout/route.ts" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falta checkout route" -ForegroundColor Red
}

if (Test-Path "src\app\api\webhooks\mercadopago\route.ts") {
    Write-Host "[OK] webhook/route.ts" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falta webhook route" -ForegroundColor Red
}

# Próximos pasos
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " PROXIMOS PASOS" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Crea usuario de prueba en:"
Write-Host "   https://www.mercadopago.cl/developers/panel/test-users" -ForegroundColor White
Write-Host ""
Write-Host "2. Ejecuta diagnóstico en Supabase SQL Editor:"
Write-Host "   scripts/diagnose-full.sql" -ForegroundColor White
Write-Host ""
Write-Host "3. Sigue la guía completa:"
Write-Host "   GUIA_RAPIDA_MP.md" -ForegroundColor White
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
