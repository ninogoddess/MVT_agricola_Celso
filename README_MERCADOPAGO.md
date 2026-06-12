# 💳 Mercado Pago - Setup Completo

## ⚡ TL;DR (Resumen Ultra-Rápido)

1. **Crea usuario de prueba**: https://www.mercadopago.cl/developers/panel/test-users (100.000 CLP)
2. **Registra cuenta** en tu app con ese email de prueba
3. **Compra el plan Pro** - El botón debería estar habilitado
4. **Done!** ✅

---

## 📚 Documentación Completa

### Si es tu primera vez configurando Mercado Pago:
👉 **Lee primero**: `INICIO_AQUI.md`

### Si quieres ir directo a la acción:
👉 **Sigue**: `GUIA_RAPIDA_MP.md` (10 minutos)

### Si tienes problemas:
👉 **Consulta**: `MERCADOPAGO_DEBUG.md`

---

## 🔍 Diagnóstico Rápido

### En tu terminal (Windows):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-setup.ps1
```

### En Supabase SQL Editor:
```sql
-- Ejecuta el contenido de: scripts/diagnose-full.sql
```

---

## ✅ Estado de tu Configuración

### Código
- ✅ Integración de PreApproval (suscripciones) implementada
- ✅ Webhook de Mercado Pago configurado
- ✅ Service layer para pagos completo
- ✅ Base de datos con estructura correcta

### Variables de Entorno (Vercel)
- ✅ `MERCADOPAGO_ACCESS_TOKEN` (TEST)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (TEST)
- ✅ `NEXT_PUBLIC_SITE_URL`

### Migraciones (Supabase)
- ✅ `0011_subscriptions_and_plans.sql` - Planes y suscripciones
- ✅ `0013_subscription_details.sql` - Detalles de MP (mp_preapproval_id)
- ✅ `0014_fix_plan_prices.sql` - Precios correctos

---

## 🐛 Problema Resuelto

**Error Original:**
```
Column up.email does not exist
```

**Solución:**
Script SQL corregido en `scripts/check-mercadopago.sql` - Ahora hace JOIN con `auth.users` correctamente.

---

## 🎯 Lo Único que Falta

**Crear y usar usuarios de prueba de Mercado Pago**

El dinero mostrado ($50.000) en la pantalla de MP no es real porque no estás usando un usuario oficial de prueba de Mercado Pago. Ellos validan contra sus propios usuarios.

**Solución**: 3 minutos
1. Ve a: https://www.mercadopago.cl/developers/panel/test-users
2. Crea usuario comprador con 100.000 CLP
3. Usa ese email en tu app

---

## 📋 Planes Configurados

| Plan | Precio | Límites |
|------|--------|---------|
| Gratis | $0 | 1 parcela, 3 cultivos, 6 recordatorios |
| Pro | $2.990 | 10 parcelas, 100 cultivos, 100 recordatorios |
| Institucional | $9.990 | 100 parcelas, 1000 cultivos, trabajadores |

---

## 🧪 Tarjetas de Prueba

Una vez en el checkout de Mercado Pago:

```
Visa:        4168 8188 4444 7115
CVV:         123
Vencimiento: 11/25
Nombre:      APRO
RUT:         11.111.111-1
```

---

## 📞 Links Útiles

- **Crear Usuarios de Prueba**: https://www.mercadopago.cl/developers/panel/test-users
- **Dashboard MP**: https://www.mercadopago.cl/developers/panel
- **Tu App**: https://agrencia.vercel.app
- **Documentación MP**: https://www.mercadopago.com/developers/es/docs/subscriptions

---

## 📁 Archivos de Referencia

```
├── INICIO_AQUI.md              ← Empieza aquí si es tu primera vez
├── GUIA_RAPIDA_MP.md           ← Guía paso a paso (10 min)
├── MERCADOPAGO_DEBUG.md        ← Análisis técnico detallado
├── CHECKLIST_MERCADOPAGO.md    ← Checklist de verificación
└── scripts/
    ├── diagnose-full.sql       ← Diagnóstico completo en Supabase
    ├── check-mercadopago.sql   ← Verificación rápida (corregido)
    ├── verify-setup.ps1        ← Verificación local (Windows)
    ├── verify-setup.sh         ← Verificación local (Linux/Mac)
    └── test-mercadopago.ts     ← Test de API de MP
```

---

**Siguiente paso**: Abre `GUIA_RAPIDA_MP.md` y sigue las instrucciones 🚀
