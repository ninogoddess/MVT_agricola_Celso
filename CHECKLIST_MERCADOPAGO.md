# ✅ Checklist de Configuración de Mercado Pago

Usa este checklist para verificar que todo está configurado correctamente.

## 🔐 1. Credenciales de Mercado Pago

- [ ] Tengo una cuenta en Mercado Pago Chile
- [ ] Tengo mis credenciales TEST (Access Token y Public Key)
- [ ] Las credenciales TEST empiezan con `TEST-`
- [ ] Las credenciales están configuradas en Vercel/Variables de Entorno

**Verificar en Vercel:**
```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

---

## 👤 2. Usuarios de Prueba

- [ ] Creé un usuario comprador en: https://www.mercadopago.cl/developers/panel/test-users
- [ ] Le asigné al menos 100.000 CLP de saldo
- [ ] Guardé el email del usuario (ej: `test_user_123456@testuser.com`)
- [ ] Guardé la contraseña del usuario

**Datos del usuario de prueba:**
```
Email: _______________________________
Saldo: _____________ CLP
```

---

## 🗄️ 3. Base de Datos (Supabase)

- [ ] Ejecuté la migración `0011_subscriptions_and_plans.sql`
- [ ] Ejecuté la migración `0013_subscription_details.sql`
- [ ] Ejecuté la migración `0014_fix_plan_prices.sql`
- [ ] Verifiqué que existan los planes: free, pro, organizacion

**Verificar en Supabase SQL Editor:**
```sql
SELECT id, name, price_clp FROM plans;
-- Debe mostrar: free ($0), pro ($2990), organizacion ($9990)
```

---

## 🔗 4. Webhook (Opcional para pruebas)

- [ ] Configuré webhook en: https://www.mercadopago.cl/developers/panel/webhooks
- [ ] URL del webhook: `https://agrencia.vercel.app/api/webhooks/mercadopago`
- [ ] Seleccioné eventos: "Pagos" y "Suscripciones"
- [ ] Guardé el secreto en Vercel como `MERCADOPAGO_WEBHOOK_SECRET`

---

## 🧪 5. Prueba del Flujo

### Paso 1: Registrar cuenta con usuario de prueba

- [ ] Fui a: https://agrencia.vercel.app/register
- [ ] Usé el email del usuario de prueba de Mercado Pago
- [ ] Completé el registro exitosamente
- [ ] Puedo iniciar sesión

### Paso 2: Intentar comprar plan Pro

- [ ] Fui a la página de Planes
- [ ] Seleccioné el plan "Pro" ($2.990)
- [ ] Me redirigió a Mercado Pago
- [ ] La pantalla de Mercado Pago muestra mi saldo disponible

### Paso 3: Completar el pago

- [ ] El botón "Confirmar" está **habilitado** (no gris)
- [ ] Clickeé "Confirmar" o usé tarjeta de prueba
- [ ] El pago se procesó exitosamente
- [ ] Fui redirigido de vuelta a mi dashboard

### Tarjetas de Prueba (si no usas saldo disponible):

```
Visa: 4168 8188 4444 7115
CVV: 123
Fecha: 11/25
Nombre: APRO
RUT: 11.111.111-1
```

---

## 🔍 6. Verificación Post-Pago

### En tu aplicación:

- [ ] Mi plan cambió de "Gratis" a "Pro"
- [ ] Puedo crear hasta 10 parcelas
- [ ] Puedo crear hasta 100 cultivos

### En Supabase:

```sql
-- Verificar suscripción actualizada
SELECT * FROM subscriptions 
WHERE plan_id = 'pro' 
ORDER BY created_at DESC 
LIMIT 1;

-- Debe mostrar: status = 'active', mp_preapproval_id con valor
```

### En Mercado Pago:

- [ ] Veo la suscripción activa en mi dashboard de MP
- [ ] El estado es "Autorizada" o "Active"

---

## ❌ Solución de Problemas

### El botón "Confirmar" está deshabilitado

**Causa más común:** No estás usando el email exacto del usuario de prueba de MP

**Solución:**
1. Verifica que el email en tu app sea **exactamente** el de MP
2. Verifica que el usuario de prueba tenga saldo > $2.990
3. Crea un nuevo usuario de prueba y vuelve a intentar

### Error: "Invalid credentials" o "Unauthorized"

**Causa:** Las credenciales en Vercel son incorrectas

**Solución:**
1. Ve a: https://www.mercadopago.cl/developers/panel/credentials
2. Copia tus credenciales TEST
3. Actualiza en Vercel
4. Redeploy la aplicación

### Error: "Preapproval not available"

**Causa:** Tu cuenta MP no tiene habilitadas las suscripciones

**Solución:**
1. Contacta soporte de Mercado Pago
2. O cambia a pagos únicos (ver `MERCADOPAGO_DEBUG.md` sección "Opción B")

---

## 🎉 ¡Todo funciona!

Si completaste todos los pasos:

✅ Tu integración con Mercado Pago está funcionando correctamente  
✅ Los usuarios pueden comprar planes  
✅ El sistema actualiza automáticamente sus suscripciones  

**Próximos pasos:**

1. Probar con otros planes (Institucional)
2. Probar cancelación de suscripción
3. Configurar webhook para recibir notificaciones
4. Cuando estés listo para producción, cambiar a credenciales reales (`APP_USR-...`)

---

**Fecha de última verificación:** _______________  
**Verificado por:** _______________
