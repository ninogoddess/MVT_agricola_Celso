#!/bin/bash

# Script de verificación rápida de Mercado Pago
# Ejecutar con: bash scripts/verify-setup.sh

echo "🔍 Verificando configuración de Mercado Pago..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar variables de entorno
check_env() {
  if [ -f .env.local ]; then
    echo "✅ Archivo .env.local encontrado"
  else
    echo "❌ No se encontró .env.local"
    exit 1
  fi
}

# Función para verificar credenciales MP
check_credentials() {
  echo ""
  echo "📋 Verificando credenciales de Mercado Pago..."
  
  if grep -q "MERCADOPAGO_ACCESS_TOKEN=TEST-" .env.local; then
    echo -e "${GREEN}✅ MERCADOPAGO_ACCESS_TOKEN configurado (TEST)${NC}"
  else
    echo -e "${RED}❌ MERCADOPAGO_ACCESS_TOKEN no encontrado o no es TEST${NC}"
  fi
  
  if grep -q "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-" .env.local; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY configurado (TEST)${NC}"
  else
    echo -e "${RED}❌ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no encontrado o no es TEST${NC}"
  fi
  
  if grep -q "NEXT_PUBLIC_SITE_URL=" .env.local; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_SITE_URL configurado${NC}"
  else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SITE_URL no encontrado${NC}"
  fi
}

# Función para verificar migraciones
check_migrations() {
  echo ""
  echo "📂 Verificando migraciones..."
  
  if [ -f "supabase/migrations/0011_subscriptions_and_plans.sql" ]; then
    echo -e "${GREEN}✅ 0011_subscriptions_and_plans.sql${NC}"
  else
    echo -e "${RED}❌ Falta migración de planes${NC}"
  fi
  
  if [ -f "supabase/migrations/0013_subscription_details.sql" ]; then
    echo -e "${GREEN}✅ 0013_subscription_details.sql${NC}"
  else
    echo -e "${RED}❌ Falta migración de detalles de suscripción${NC}"
  fi
  
  if [ -f "supabase/migrations/0014_fix_plan_prices.sql" ]; then
    echo -e "${GREEN}✅ 0014_fix_plan_prices.sql${NC}"
  else
    echo -e "${YELLOW}⚠️  Falta migración de precios${NC}"
  fi
}

# Función para verificar archivos clave
check_files() {
  echo ""
  echo "📄 Verificando archivos de integración..."
  
  if [ -f "src/lib/services/payment.service.ts" ]; then
    echo -e "${GREEN}✅ payment.service.ts${NC}"
  else
    echo -e "${RED}❌ Falta payment.service.ts${NC}"
  fi
  
  if [ -f "src/app/api/checkout/route.ts" ]; then
    echo -e "${GREEN}✅ checkout/route.ts${NC}"
  else
    echo -e "${RED}❌ Falta checkout route${NC}"
  fi
  
  if [ -f "src/app/api/webhooks/mercadopago/route.ts" ]; then
    echo -e "${GREEN}✅ webhook/route.ts${NC}"
  else
    echo -e "${RED}❌ Falta webhook route${NC}"
  fi
}

# Función principal
main() {
  echo "======================================"
  echo "  Verificación de Mercado Pago"
  echo "======================================"
  
  check_env
  check_credentials
  check_migrations
  check_files
  
  echo ""
  echo "======================================"
  echo "📝 Próximos pasos:"
  echo "======================================"
  echo ""
  echo "1. Crea usuario de prueba en:"
  echo "   https://www.mercadopago.cl/developers/panel/test-users"
  echo ""
  echo "2. Ejecuta diagnóstico en Supabase:"
  echo "   scripts/diagnose-full.sql"
  echo ""
  echo "3. Sigue la guía completa:"
  echo "   GUIA_RAPIDA_MP.md"
  echo ""
  echo "======================================"
}

# Ejecutar
main
