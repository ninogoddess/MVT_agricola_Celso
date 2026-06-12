# 🛠️ Solución: "Una de las partes con la que intentas hacer el pago es de prueba"

## 🎯 Causa del Error

Estás **mezclando** dos entornos de prueba que Mercado Pago NO permite combinar:

- **Vendedor:** token `TEST-...` de **tu cuenta real** (vendedor = real-en-test)
- **Comprador:** usuario de **prueba** con saldo de billetera ($50.000)

MP detecta que una parte es real y la otra es de prueba → **bloquea el pago**.

El flujo de "Dinero disponible" (billetera) **solo funciona entre usuarios de prueba**.
Por eso necesitas que **AMBAS partes sean usuarios de prueba**.

---

## ✅ Solución: Usar el Token del VENDEDOR de Prueba

### Paso 1: Crear DOS usuarios de prueba (mismo país: Chile)

Ve a: https://www.mercadopago.cl/developers/panel/test-users

Crea **dos** usuarios, ambos con país **Chile**:

| Usuario | Tipo | Saldo |
|---------|------|-------|
| **VENDEDOR** | Vendedor | (no importa) |
| **COMPRADOR** | Comprador | 100.000 CLP |

Guarda usuario y contraseña de cada uno:

```
VENDEDOR:
  Usuario: TESTXXXXXXXX
  Email:   test_user_VENDEDOR@testuser.com
  Pass:    ___________

COMPRADOR:
  Usuario: TESTYYYYYYYY
  Email:   test_user_COMPRADOR@testuser.com
  Pass:    ___________
```

### Paso 2: Obtener el Access Token del VENDEDOR de prueba

⚠️ **Este es el paso clave que faltaba.** No debes usar el token de tu cuenta real.

1. Abre una **ventana de incógnito** (o un navegador distinto)
2. Ve a: https://www.mercadopago.cl
3. **Inicia sesión con el usuario VENDEDOR de prueba** (usuario y contraseña del paso 1)
4. Estando logueado como el vendedor de prueba, ve a:
   https://www.mercadopago.cl/developers/panel/app
5. Crea una **aplicación nueva** (cualquier nombre, ej: "Agrencia Test")
   - Tipo: "Pagos online" / "Suscripciones (CheckoutPro / Preapproval)"
6. Entra a **Credenciales de producción** de esa app
   - Como el usuario es de prueba, estas credenciales **ya son de prueba**
   - Copia el **Access Token** (formato `APP_USR-...`)
   - Copia la **Public Key** (formato `APP_USR-...`)

> 💡 Para usuarios de prueba, las credenciales "de producción" SON credenciales de prueba
> porque toda la cuenta es ficticia. Es correcto y esperado.

### Paso 3: Reemplazar el token en tu app

#### En local (`.env.local`):

```bash
# Reemplaza con las credenciales del VENDEDOR de prueba
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXX-del-vendedor-de-prueba
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXX-del-vendedor-de-prueba
```

#### En Vercel:

1. Settings → Environment Variables
2. Actualiza `MERCADOPAGO_ACCESS_TOKEN` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   con las credenciales del **vendedor de prueba**
3. **Redeploy** (Deployments → ... → Redeploy)

### Paso 4: Pagar como el COMPRADOR de prueba

1. Abre tu app: https://agrencia.vercel.app
2. En el checkout de MP, **inicia sesión con el usuario COMPRADOR de prueba**
3. Ahora ambas partes son de prueba → el pago se procesa ✅

---

## 📋 Resumen de la Regla

| | Vendedor (token en tu app) | Comprador (en checkout) | ¿Funciona? |
|---|---|---|---|
| ❌ Lo que hacías | Token TEST de cuenta real | Usuario de prueba (billetera) | NO - "una parte es de prueba" |
| ✅ Solución | Token del VENDEDOR de prueba | Usuario COMPRADOR de prueba | SÍ |
| ✅ Alternativa | Token TEST de cuenta real | Tarjeta de prueba (sin login) | SÍ (pero sin billetera) |

---

## 🃏 Alternativa: Solo Tarjetas de Prueba

Si NO quieres crear usuario vendedor de prueba, puedes mantener tu token actual
(`TEST-4683...` de tu cuenta real) PERO entonces:

- **NO inicies sesión** en el checkout de MP
- **NO uses "Dinero disponible"**
- Paga como **invitado** con una **tarjeta de prueba**:

```
Visa:        4168 8188 4444 7115
Nombre:      APRO
Vencimiento: 11/25
CVV:         123
RUT:         11.111.111-1
```

> ⚠️ Para **suscripciones (preapproval)** el flujo de tarjeta suele requerir cuenta,
> así que para suscripciones lo más confiable es la **Opción B (usuarios de prueba)**.

---

## ❓ Sobre los errores de la consola (CSP, browser.js, melidata 400)

**Ignóralos.** No vienen de tu app. Verifiqué tu `next.config.ts` y no aplicas ningún CSP.
Esos mensajes son scripts internos de la página de Mercado Pago (`/checkout/v1/...`,
`api.mercadolibre.com`). No tienen relación con el error del pago.

---

## ✅ Verificación Final

Después de aplicar la Opción B:

```sql
-- En Supabase, tras pagar:
SELECT plan_id, status, mp_preapproval_id
FROM subscriptions
WHERE status = 'active'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: plan_id='pro', status='active', mp_preapproval_id con valor
```


---

# 🔁 Segundo error: "Both payer and collector must be real or test users"

## Significado

> Tanto el **pagador (payer)** como el **cobrador (collector)** deben ser ambos
> de prueba o ambos reales. No se pueden mezclar.

- Collector (token de tu app) = vendedor de prueba ✅
- Payer (`payer_email`) = email **real** de la cuenta de Agrencia ❌

El `payer_email` que tu app envía a MP es `ctx.user.email`, es decir, **el email con
el que iniciaste sesión en Agrencia**. Si esa cuenta se registró con un email normal,
MP ve cobrador=prueba + pagador=real → bloquea.

## Solución (recomendada, sin tocar código)

El email de la cuenta de Agrencia debe ser **el del COMPRADOR de prueba**.

1. Copia el email del usuario **COMPRADOR de prueba**
   (ej: `test_user_12345678@testuser.com`) desde
   https://www.mercadopago.cl/developers/panel/test-users
2. En Agrencia, **registra una cuenta nueva** con **ese mismo email**.
3. Inicia sesión en Agrencia con esa cuenta → "Actualizar a Pro".
4. En el checkout de MP, inicia sesión como ese **comprador de prueba**.
5. Pagador = comprador de prueba, Cobrador = vendedor de prueba → ✅ funciona.

## Alternativa rápida (forzar email en código)

Si no quieres registrar una cuenta nueva, fuerza el email del comprador de prueba
en `src/app/api/checkout/route.ts` (SOLO PARA PRUEBAS, revertir antes de producción):

```typescript
const { sandboxInitPoint } = await paymentService.createSubscriptionCheckout(
  ctx.tenantId,
  plan.id,
  plan.price_clp,
  plan.name,
  'test_user_12345678@testuser.com' // ← email del COMPRADOR de prueba (temporal)
);
```

Luego haz commit + redeploy en Vercel. **Recuerda revertir** a `ctx.user.email`
antes de pasar a producción.

## Regla final (resumen visual)

| Collector (token) | Payer (payer_email / login Agrencia) | Resultado |
|-------------------|--------------------------------------|-----------|
| Vendedor de prueba | Email real | ❌ "must be real or test" |
| Vendedor de prueba | Comprador de prueba | ✅ Funciona |
| Cuenta real (prod) | Cliente real | ✅ Producción |
