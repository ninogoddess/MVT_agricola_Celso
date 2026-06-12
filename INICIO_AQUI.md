# 🎯 COMIENZA AQUÍ: Configurar Mercado Pago

**Tu código está correcto. Solo necesitas configurar usuarios de prueba de Mercado Pago.**

---

## 🚀 Inicio Rápido (3 pasos)

### Paso 1: Verificar tu configuración local

```powershell
# En tu terminal (Windows PowerShell):
powershell -ExecutionPolicy Bypass -File scripts/verify-setup.ps1
```

Esto verifica que tengas todos los archivos y variables de entorno necesarias.

---

### Paso 2: Diagnosticar estado en Supabase

1. Abre **Supabase SQL Editor**: 
   - Ve a tu proyecto en Supabase
   - Click en "SQL Editor" en el menú izquierdo

2. Abre el archivo: `scripts/diagnose-full.sql`

3. **Copia todo el contenido** y pégalo en el SQL Editor

4. Click en **"Run"** (o presiona Ctrl+Enter)

5. **Revisa los resultados**:
   - ✅ Planes: Debes ver free ($0), pro ($2990), organizacion ($9990)
   - ✅ Columna `mp_preapproval_id` debe existir
   - ✅ Verifica si ya tienes suscripciones activas

---

### Paso 3: Seguir la guía completa

Abre el archivo: **`GUIA_RAPIDA_MP.md`**

Esta guía te lleva paso a paso para:
1. ✅ Crear usuario de prueba en Mercado Pago
2. ✅ Registrarte en tu app con ese usuario
3. ✅ Probar el flujo de pago completo
4. ✅ Verificar que todo funcione

**Tiempo estimado: 10 minutos**

---

## 📁 Archivos de Ayuda Creados

### Documentación

- **`GUIA_RAPIDA_MP.md`** ⭐ **EMPIEZA AQUÍ**
  - Guía paso a paso para poner todo en funcionamiento
  - Incluye solución de problemas comunes
  
- **`MERCADOPAGO_DEBUG.md`**
  - Análisis técnico detallado del problema
  - Soluciones alternativas (pagos únicos vs suscripciones)
  
- **`CHECKLIST_MERCADOPAGO.md`**
  - Checklist de verificación paso a paso
  - Úsalo para confirmar que todo esté correcto

### Scripts SQL

- **`scripts/diagnose-full.sql`** ⭐ **EJECUTA ESTO EN SUPABASE**
  - Diagnóstico completo del sistema
  - Muestra planes, suscripciones, usuarios, logs
  
- **`scripts/check-mercadopago.sql`**
  - Versión simplificada del diagnóstico (YA CORREGIDO)

### Scripts de Verificación

- **`scripts/verify-setup.ps1`** (Windows PowerShell)
  - Verifica configuración local
  
- **`scripts/verify-setup.sh`** (Linux/Mac)
  - Mismo propósito, versión bash

- **`scripts/test-mercadopago.ts`**
  - Script Node.js para probar conexión con API de MP
  - Ejecutar con: `npx tsx scripts/test-mercadopago.ts`

---

## 🐛 Problema Identificado y Solucionado

### ❌ Error Original

```
Failed to run sql query: ERROR: 42703: column up.email does not exist
```

### ✅ Solución Aplicada

La tabla `user_profiles` no tiene columna `email` porque el email está en `auth.users`.

**Script corregido**: `scripts/check-mercadopago.sql` ahora hace JOIN correctamente:

```sql
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  au.email,  -- ← De auth.users, no de user_profiles
  up.role
FROM tenants t
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = up.id  -- ← JOIN añadido
ORDER BY t.created_at DESC;
```

---

## 🎯 Qué Hacer Ahora

1. **Ejecuta el diagnóstico en Supabase**: `scripts/diagnose-full.sql`
   - Esto te mostrará el estado completo de tu sistema

2. **Sigue la guía paso a paso**: `GUIA_RAPIDA_MP.md`
   - Te llevará desde crear usuario de prueba hasta confirmar que todo funciona

3. **Si algo falla**, consulta: `MERCADOPAGO_DEBUG.md`
   - Tiene soluciones para todos los problemas comunes

---

## 📞 Recursos Importantes

### Mercado Pago
- **Dashboard**: https://www.mercadopago.cl/developers/panel
- **Usuarios de Prueba**: https://www.mercadopago.cl/developers/panel/test-users
- **Credenciales**: https://www.mercadopago.cl/developers/panel/credentials
- **Webhooks**: https://www.mercadopago.cl/developers/panel/webhooks

### Tu Aplicación
- **Producción**: https://agrencia.vercel.app
- **Registro**: https://agrencia.vercel.app/register
- **Planes**: https://agrencia.vercel.app/planes

### Supabase
- **Dashboard**: https://supabase.com/dashboard
- **SQL Editor**: Proyecto → SQL Editor

---

## ✅ Confirmación Final

Después de seguir la guía, deberías poder:

- [x] Crear usuario de prueba en Mercado Pago
- [x] Registrar cuenta en tu app con ese email
- [x] Comprar el plan Pro ($2.990)
- [x] Ver el botón "Confirmar" habilitado en MP
- [x] Completar el pago exitosamente
- [x] Verificar que tu plan cambió a "Pro" en tu app
- [x] Crear más parcelas/cultivos (nuevos límites)

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona después de seguir la guía:

1. Ejecuta: `scripts/diagnose-full.sql` en Supabase
2. Revisa la sección "Solución de Problemas" en `GUIA_RAPIDA_MP.md`
3. Consulta: `MERCADOPAGO_DEBUG.md` para detalles técnicos

---

**¡Todo está listo para funcionar! Solo sigue la GUIA_RAPIDA_MP.md** 🚀
