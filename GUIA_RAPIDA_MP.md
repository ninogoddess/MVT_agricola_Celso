# 🚀 Guía Rápida: Poner Mercado Pago en Funcionamiento

**Tiempo estimado: 10 minutos**

---

## ✅ Paso 1: Verificar Estado Actual en Supabase

1. Abre **Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. Ejecuta el script completo de diagnóstico:

```sql
-- Copia y pega el contenido de: scripts/diagnose-full.sql
```

3. **Revisa los resultados**:
   - ✅ Deben existir 3 planes: free, pro, organizacion
   - ✅ El precio del plan "pro" debe ser 2990
   - ✅ Debe existir la columna `mp_preapproval_id` en subscriptions

---

## ✅ Paso 2: Crear Usuario de Prueba en Mercado Pago

### 2.1 Acceder al Panel de Desarrolladores

1. Ve a: https://www.mercadopago.cl/developers/panel/test-users
2. Inicia sesión con tu cuenta de Mercado Pago

### 2.2 Crear Usuario Comprador

1. Click en **"Crear usuario de prueba"**
2. Completa el formulario:
   - **Tipo de usuario:** Comprador
   - **Monto disponible:** 100000 (CLP)
   
3. Click en **"Crear"**

4. **¡IMPORTANTE!** Guarda estos datos:

```
Email: test_user_XXXXXXXXX@testuser.com
Contraseña: XXXXXXXXX
Saldo: 100,000 CLP
```

📋 **Copia el email completo exactamente como aparece**

---

## ✅ Paso 3: Verificar Credenciales en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Verifica que existan:

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-4683870347374770-061117-bc9ba572538a4ffa93ada7b0fc1cd272-3466506249
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-059dffab-13c0-49fd-aae6-5e3764b0964e
NEXT_PUBLIC_SITE_URL=https://agrencia.vercel.app
```

✅ Ya las tienes configuradas correctamente

---

## ✅ Paso 4: Registrar Cuenta de Prueba en tu App

### Opción A: Registro Manual (RECOMENDADO)

1. **Abre tu app** en modo incógnito: https://agrencia.vercel.app

2. **Ve a Registro**: https://agrencia.vercel.app/register

3. **Usa el email del usuario de prueba de MP**:
   ```
   Email: test_user_XXXXXXXXX@testuser.com  ← El que MP te dio
   Nombre: Test Usuario
   Contraseña: cualquiera (para tu app)
   ```

4. **Completa el registro**

5. **Inicia sesión** con esas credenciales

### Opción B: Forzar Email de Prueba en el Código

Si prefieres que siempre use un usuario de prueba:

```typescript
// src/app/api/checkout/route.ts - Línea 28-33
const { sandboxInitPoint } = await paymentService.createSubscriptionCheckout(
  ctx.tenantId,
  plan.id,
  plan.price_clp,
  plan.name,
  'test_user_XXXXXXXXX@testuser.com' // ← REEMPLAZA con tu email de prueba
);
```

Luego despliega de nuevo en Vercel.

---

## ✅ Paso 5: Probar el Flujo de Pago

### 5.1 Ir a Planes

1. Estando logueado, ve a: **Planes** o **Configuración → Planes**
2. Deberías ver 3 planes: Gratis, Pro, Institucional

### 5.2 Intentar Comprar Plan Pro

1. Click en **"Mejorar a Pro"** ($2.990)
2. Espera a ser redirigido a Mercado Pago
3. Deberías ver una pantalla con:
   - "Suscripción Mensual - Plan Pro"
   - "Total por mes: $ 2.990"
   - "Dinero disponible: $ 100.000"

### 5.3 Verificar el Botón "Confirmar"

**¿El botón "Confirmar" está habilitado (verde)?**

- ✅ **SÍ** → ¡Perfecto! Continúa al paso 5.4
- ❌ **NO (gris)** → Hay un problema, ve a la sección de "Problemas"

### 5.4 Completar el Pago

**OPCIÓN 1: Usar Saldo Disponible**
1. Click en **"Confirmar"**
2. Serás redirigido a tu dashboard
3. Tu plan debería cambiar a "Pro"

**OPCIÓN 2: Usar Tarjeta de Prueba**
1. Click en "Cambiar forma de pago"
2. Selecciona "Tarjeta de crédito o débito"
3. Ingresa:
   ```
   Número: 4168 8188 4444 7115
   Nombre: APRO
   Vencimiento: 11/25
   CVV: 123
   RUT: 11.111.111-1
   ```
4. Click en "Pagar"

---

## ✅ Paso 6: Verificar que Funcionó

### 6.1 En tu Aplicación

1. Ve a tu **Dashboard**
2. Verifica:
   - ✅ Badge o indicador muestra "Plan Pro"
   - ✅ Puedes crear hasta 10 parcelas (antes: 1)
   - ✅ Puedes crear hasta 100 cultivos (antes: 3)

### 6.2 En Supabase

Ejecuta en SQL Editor:

```sql
-- Ver tu suscripción actualizada
SELECT 
  t.name,
  s.plan_id,
  s.status,
  s.mp_preapproval_id,
  s.start_date
FROM subscriptions s
JOIN tenants t ON t.id = s.tenant_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 1;
```

**Deberías ver:**
- `plan_id = 'pro'`
- `status = 'active'`
- `mp_preapproval_id` con un valor (ej: "2c938084...")

### 6.3 En Mercado Pago

1. Ve a: https://www.mercadopago.cl/subscriptions/list
2. Deberías ver tu suscripción "Plan Pro"
3. Estado: "Autorizada" o "Active"

---

## 🎉 ¡FUNCIONANDO!

Si llegaste hasta aquí y todo funcionó:

✅ **Tu integración de Mercado Pago está operativa**  
✅ **Los usuarios pueden comprar planes**  
✅ **El sistema actualiza suscripciones automáticamente**

---

## ❌ Solución de Problemas

### Problema 1: Botón "Confirmar" Deshabilitado

**Causa más probable:** Email incorrecto

**Solución:**
1. Verifica que el email sea **EXACTAMENTE** el de MP
2. Cierra sesión y vuelve a registrarte con el email correcto
3. O usa la Opción B (forzar email en código)

**Verificar en Supabase:**
```sql
SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1;
-- Debe ser: test_user_XXXXXXXXX@testuser.com
```

---

### Problema 2: Error "Invalid credentials"

**Causa:** Credenciales incorrectas en Vercel

**Solución:**
1. Ve a: https://www.mercadopago.cl/developers/panel/credentials
2. Copia las credenciales TEST
3. Actualiza en Vercel
4. Redeploy

---

### Problema 3: Error "Preapproval not supported"

**Causa:** Tu cuenta MP no tiene suscripciones habilitadas

**Solución temporal:**

Cambia a pagos únicos. Modifica el archivo:

```typescript
// src/lib/services/payment.service.ts
import { Preference } from 'mercadopago';

async createOneTimePayment(tenantId: string, planId: string, priceClp: number, planName: string) {
  const preference = new Preference(client);
  const siteUrl = this.getSiteUrl();

  const result = await preference.create({
    body: {
      items: [{
        title: `Plan ${planName} - 1 Mes`,
        quantity: 1,
        unit_price: priceClp,
        currency_id: 'CLP',
      }],
      external_reference: JSON.stringify({ tenantId, planId }),
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success`,
        failure: `${siteUrl}/planes?payment=failure`,
        pending: `${siteUrl}/dashboard?payment=pending`,
      },
      auto_return: 'approved',
    },
  });

  return {
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  };
}
```

Y en `src/app/api/checkout/route.ts`:
```typescript
const { sandboxInitPoint } = await paymentService.createOneTimePayment(/* ... */);
```

---

### Problema 4: No veo el cambio de plan en mi app

**Causa:** El webhook no se procesó

**Verificar en Supabase:**
```sql
SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 5;
```

**Si no hay logs:**
1. Configura el webhook en MP: https://www.mercadopago.cl/developers/panel/webhooks
2. URL: `https://agrencia.vercel.app/api/webhooks/mercadopago`
3. Eventos: "Pagos" y "Suscripciones"

**Solución temporal:** Actualiza manualmente en Supabase:
```sql
UPDATE subscriptions 
SET plan_id = 'pro', status = 'active'
WHERE tenant_id = 'TU_TENANT_ID';
```

---

## 📞 Recursos de Ayuda

- **Dashboard MP:** https://www.mercadopago.cl/developers/panel
- **Usuarios de Prueba:** https://www.mercadopago.cl/developers/panel/test-users
- **Tarjetas de Prueba:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards
- **Documentación:** https://www.mercadopago.com/developers/es/docs/subscriptions

---

**¿Necesitas más ayuda?**

Ejecuta el diagnóstico completo:
```bash
# En Supabase SQL Editor
-- Ejecuta: scripts/diagnose-full.sql
```

Y revisa el documento detallado: `MERCADOPAGO_DEBUG.md`
