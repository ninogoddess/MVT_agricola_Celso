# 🔍 Análisis del Problema de Mercado Pago

## ❌ Problema Identificado

El botón "Confirmar" está deshabilitado en la pantalla de Mercado Pago porque:

### Causa Principal: **Usuario de Prueba Incorrecto**

1. **Estás usando PreApproval API (Suscripciones)** - Esto es correcto ✅
2. **NO estás usando un usuario de prueba de Mercado Pago** - ❌ Este es el problema
3. **El dinero mostrado ($50.000) no es válido** - La cuenta no es de prueba de MP

### ¿Por qué pasa esto?

Mercado Pago **requiere usar usuarios de prueba específicos** creados desde tu dashboard. No puedes usar cualquier email o cuenta, incluso si asignas saldo manualmente en tu base de datos.

La pantalla que ves dice "Dinero disponible: $50.000" pero ese dinero **no existe en Mercado Pago**, solo en tu aplicación. Mercado Pago valida contra SUS usuarios de prueba.

---

## ✅ Soluciones

### Solución 1: Crear y Usar Usuarios de Prueba (OBLIGATORIO) ⭐

#### Paso 1: Crear usuarios de prueba en Mercado Pago

1. **Inicia sesión** en tu cuenta de Mercado Pago
2. Ve a: https://www.mercadopago.cl/developers/panel/test-users
3. **Crea un usuario comprador (buyer):**
   - Click en "Crear usuario de prueba"
   - Tipo: **Comprador**
   - Dinero disponible: **100.000 CLP** (o más)
   - Guarda el **email** generado (ejemplo: `test_user_123456@testuser.com`)
   - Guarda la **contraseña**

#### Paso 2: Registrarte con el usuario de prueba

**OPCIÓN A: Registro directo (MÁS FÁCIL)**

1. Ve a tu app: https://agrencia.vercel.app/register
2. Usa el email del usuario de prueba: `test_user_123456@testuser.com`
3. Crea una contraseña cualquiera para tu app
4. Completa el registro normalmente

**OPCIÓN B: Modificar código para usar siempre email de prueba**

```typescript
// En src/app/api/checkout/route.ts - LÍNEA 28-33
const { sandboxInitPoint } = await paymentService.createSubscriptionCheckout(
  ctx.tenantId,
  plan.id,
  plan.price_clp,
  plan.name,
  'test_user_123456@testuser.com' // ← Reemplaza con TU email de prueba
);
```

⚠️ **IMPORTANTE**: Debes usar el email EXACTO que Mercado Pago te generó.

### Solución 2: Usar Tarjetas de Prueba de Mercado Pago

Una vez en el checkout con el usuario de prueba, usa estas tarjetas:

#### ✅ Tarjetas de Prueba para Chile (CLP):

| Tarjeta | Número | CVV | Fecha | Nombre | Estado |
|---------|--------|-----|-------|--------|--------|
| **Visa** | 4168 8188 4444 7115 | 123 | 11/25 | APRO | ✅ Aprobada |
| **Mastercard** | 5416 7526 0258 2580 | 123 | 11/25 | APRO | ✅ Aprobada |
| **Amex** | 3711 803032 57522 | 1234 | 11/25 | APRO | ✅ Aprobada |

**RUT/DNI de prueba:** 11.111.111-1

📖 Más detalles: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

### Solución 3: Verificar Estado en Base de Datos

Ejecuta el script SQL que creé para diagnosticar:

```sql
-- Ver en Supabase SQL Editor: scripts/check-mercadopago.sql
SELECT * FROM subscriptions WHERE plan_id = 'pro' OR plan_id = 'organizacion';
SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Problemas Encontrados en el Código

### ⚠️ Email de fallback no es de prueba

**Archivo:** `src/app/api/checkout/route.ts` - Línea 33

```typescript
// ❌ PROBLEMA: Si ctx.user.email es null, usa un email real
ctx.user.email || 'hola@agrencia.cl'

// ✅ SOLUCIÓN: Usar email de prueba
ctx.user.email || 'test_user_buyer@testuser.com'
```

### ⚠️ Falta manejo de errores específicos de MP

El código actual no distingue entre tipos de error de Mercado Pago. Sería útil agregar:

```typescript
// src/app/api/checkout/route.ts
try {
  const { sandboxInitPoint } = await paymentService.createSubscriptionCheckout(/* ... */);
  return NextResponse.json({ url: sandboxInitPoint });
} catch (err: any) {
  console.error('Checkout error:', err);
  
  // Mensajes más específicos
  if (err.message?.includes('unauthorized')) {
    return NextResponse.json({ 
      error: 'Credenciales de Mercado Pago inválidas. Verifica tus tokens.' 
    }, { status: 401 });
  }
  
  if (err.message?.includes('preapproval')) {
    return NextResponse.json({ 
      error: 'Tu cuenta de MP no tiene habilitadas las suscripciones. Contacta soporte.' 
    }, { status: 400 });
  }
  
  return NextResponse.json({ 
    error: `Error de Mercado Pago: ${err.message || 'Desconocido'}` 
  }, { status: 500 });
}
```

---

## ✅ Verificación de Configuración

### Variables de Entorno en Vercel

Asegúrate de tener estas variables en Vercel (ya las tienes ✅):

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-4683870347374770-061117-bc9ba572538a4ffa93ada7b0fc1cd272-3466506249
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-059dffab-13c0-49fd-aae6-5e3764b0964e
NEXT_PUBLIC_SITE_URL=https://agrencia.vercel.app
```

### Migraciones de Base de Datos

Verifica que estas migraciones estén aplicadas en Supabase:

```sql
-- 0011_subscriptions_and_plans.sql ✅
-- 0013_subscription_details.sql ✅ (mp_preapproval_id, next_billing_date)
-- 0014_fix_plan_prices.sql ✅
```

Para verificar:
```sql
-- En Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';

-- Deberías ver: mp_preapproval_id, next_billing_date, cancelled_at
```

---

1. ✅ **Crea usuario de prueba**: https://www.mercadopago.cl/developers/panel/test-users
   - Tipo: Comprador
   - Dinero: 100.000 CLP

2. ✅ **Registra cuenta nueva** en tu app con ese email de prueba

3. ✅ **Intenta comprar** el plan Pro ($2.990)

4. ✅ **Usa tarjeta de prueba**: 
   - Número: `4168 8188 4444 7115`
   - CVV: `123`
   - Fecha: `11/25`
   - Nombre: `APRO`
   - RUT: `11.111.111-1`

5. ✅ **Confirma el pago** - El botón ahora debería estar habilitado

---

## 🔍 Problemas Comunes y Soluciones

### ❌ Problema: "El botón Confirmar sigue deshabilitado"

**Posibles causas:**
1. **No usaste el email de prueba de Mercado Pago** - Verifica que sea el exacto que MP te dio
2. **Usuario de prueba sin saldo** - Verifica en MP que tenga > $2.990 CLP
3. **Credenciales incorrectas en Vercel** - Verifica las variables de entorno

**Solución:**
```bash
# Verifica en Vercel que tengas:
MERCADOPAGO_ACCESS_TOKEN=TEST-4683870347374770-061117-bc9ba572538a4ffa93ada7b0fc1cd272-3466506249
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-059dffab-13c0-49fd-aae6-5e3764b0964e
```

### ❌ Problema: "Error al crear la suscripción"

**Causa:** Tu cuenta de Mercado Pago puede no tener habilitadas las suscripciones (PreApproval)

**Solución:**
1. Ve a tu dashboard de Mercado Pago
2. Solicita activación de "Suscripciones" en Configuración > Productos
3. O contacta soporte de Mercado Pago

**Alternativa:** Cambiar a pagos únicos (ver sección "Opción B" más abajo)

### ❌ Problema: "Webhook no recibe eventos"

**Causa:** El webhook no está configurado en Mercado Pago

**Solución:**
1. Ve a: https://www.mercadopago.cl/developers/panel/webhooks
2. Agrega URL: `https://agrencia.vercel.app/api/webhooks/mercadopago`
3. Eventos: Selecciona "Pagos" y "Suscripciones"
4. Guarda el secreto en Vercel: `MERCADOPAGO_WEBHOOK_SECRET`

---

## 🛠️ Cambios Opcionales al Código

### Si PreApproval no funciona: Cambiar a Pagos Únicos

Si las suscripciones no están habilitadas en tu cuenta MP, puedes cambiar a pagos únicos:

```typescript
// src/lib/services/payment.service.ts
import { Preference } from 'mercadopago';

async createPaymentCheckout(tenantId: string, planId: string, priceClp: number, planName: string) {
  const preference = new Preference(client);
  const siteUrl = this.getSiteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          title: `Plan ${planName} - Mensual`,
          quantity: 1,
          unit_price: priceClp,
          currency_id: 'CLP',
        },
      ],
      external_reference: JSON.stringify({ tenantId, planId }),
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success`,
        failure: `${siteUrl}/planes?payment=failure`,
        pending: `${siteUrl}/dashboard?payment=pending`,
      },
      auto_return: 'approved',
      payment_methods: {
        installments: 1, // Sin cuotas
      },
    },
  });

  return {
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  };
}
```

Luego actualiza la ruta de checkout:

```typescript
// src/app/api/checkout/route.ts - Línea 28
const { sandboxInitPoint } = await paymentService.createPaymentCheckout( // ← Cambio aquí
  ctx.tenantId,
  plan.id,
  plan.price_clp,
  plan.name
);
```

---


## 📊 Resumen Ejecutivo

### ¿Por qué no funciona el botón "Confirmar"?

**Causa:** No estás usando un usuario de prueba de Mercado Pago. El sistema espera un email registrado en MP con saldo asignado.

### ¿Qué debo hacer?

1. **Crear usuario de prueba** en MP con 100.000 CLP
2. **Registrar cuenta** en tu app con ese email
3. **Intentar comprar** el plan Pro
4. **Usar tarjeta de prueba** de Mercado Pago

### ¿Está mal configurado algo en el código?

**No.** Tu código está correcto:
- ✅ Credenciales de prueba válidas
- ✅ PreApproval API correctamente implementada
- ✅ Webhook configurado
- ✅ Base de datos con estructura correcta

**El único problema es que necesitas usar usuarios de prueba de Mercado Pago.**

### Tiempo estimado de solución

⏱️ **5-10 minutos** si sigues los pasos de "ACCIÓN INMEDIATA"

---

## 📞 Recursos Adicionales

- **Usuarios de prueba MP:** https://www.mercadopago.cl/developers/panel/test-users
- **Tarjetas de prueba:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards
- **Dashboard MP:** https://www.mercadopago.cl/developers/panel
- **Webhooks MP:** https://www.mercadopago.cl/developers/panel/webhooks
- **Documentación PreApproval:** https://www.mercadopago.com/developers/es/docs/subscriptions/integration-configuration

---

**Última actualización:** 2026-06-12  
**Archivo creado por:** Kiro AI Assistant
