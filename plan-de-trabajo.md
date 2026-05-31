# Plan de Trabajo — MVP Gestión de Cosechas Inteligentes

## Stack Confirmado

| Componente | Servicio | Plan |
|---|---|---|
| Frontend + API | Next.js (App Router) + TypeScript | — |
| Despliegue | Vercel | Free (Hobby) |
| Base de datos + Auth | Supabase (PostgreSQL + Auth + RLS) | Free |
| API Climática (primaria) | Open-Meteo | Free, sin API key |
| API Climática (fallback) | OpenWeatherMap | Free (requiere API key) |
| Repositorio | GitHub | Free |
| Validación | Zod | — |

## Sobre la API de Clima

**Open-Meteo** ya está definida en el diseño como provider primario. Es la mejor opción porque:
- No requiere API key ni registro
- ~10,000 llamadas/día (suficiente para el MVP)
- Datos actuales + pronóstico horario + diario hasta 72h
- Soporte de timezone automático por coordenadas
- Cobertura global (incluye Chile completo)

Como fallback opcional queda OpenWeatherMap (free tier: 60 calls/min, 1M calls/mes, requiere registrarse para obtener API key).

## Cultivos Chilenos Incluidos (30 especies)

### Frutales
1. Uva (de mesa y vinífera)
2. Palta (Hass)
3. Manzana (Royal Gala, Fuji)
4. Cereza (Lapins, Bing)
5. Arándano (Duke, Brigitta)
6. Frambuesa (Heritage)
7. Kiwi (Hayward)
8. Durazno / Nectarín
9. Ciruela (D'Agen, Angeleno)

### Hortalizas
10. Tomate (determinado e indeterminado)
11. Lechuga (varias)
12. Papa (Désirée, Cardinal)
13. Cebolla (valenciana)
14. Ajo (rosado, morado)
15. Zapallo (camote, butternut)
16. Pimiento / Ají (cristal, cacho de cabra)
17. Choclo (maíz dulce)
18. Remolacha
19. Zanahoria
20. Espinaca
21. Acelga
22. Alcachofa
23. Espárrago
24. Poroto (frijol)

### Cereales y oleaginosas
25. Trigo (pan, candeal)
26. Maíz (grano)
27. Avena
28. Cebada
29. Raps (canola)

### Leguminosas
30. Poroto (frijol) — ya listado en hortalizas

## Fases de Desarrollo

El proyecto se divide en 5 fases incrementales. Cada fase termina con un checkpoint de verificación antes de avanzar.

---

### Fase 1: Infraestructura y Base de Datos (Semana 1-2)

**Objetivo**: Tener el proyecto configurado, la BD lista en Supabase, y la autenticación funcionando.

| # | Tarea | Estado |
|---|---|---|
| 1 | Crear repo en GitHub y conectar con Vercel | Pendiente |
| 2 | Inicializar proyecto Next.js + TypeScript + dependencias | Marcada ✓ (por hacer) |
| 3 | Configurar Supabase (proyecto free tier) | Pendiente |
| 4 | Crear migraciones SQL (tablas + índices) | Marcada ✓ (por hacer) |
| 5 | Aplicar políticas RLS | Marcada ✓ (por hacer) |
| 6 | Implementar clientes Supabase (browser, server, service-role) | Marcada ✓ (por hacer) |
| 7 | Implementar auth (register, login, logout) | Marcada ✓ (por hacer) |
| 8 | Implementar middleware de tenant context | Marcada ✓ (por hacer) |
| 9 | Crear `.env.example` y configurar variables en Vercel | Marcada ✓ (por hacer) |
| 10 | Seed de `crop_parameters` (30 cultivos chilenos) | Marcada ✓ (por hacer) |

**Entregable**: Login funcional, BD con esquema completo, seed de cultivos aplicado.

---

### Fase 2: Servicios de Negocio (Semana 2-3)

**Objetivo**: Toda la lógica de negocio implementada y probada unitariamente.

| # | Tarea | Estado |
|---|---|---|
| 1 | Repositorio base + repositorios específicos | Marcada ✓ (por hacer) |
| 2 | Servicio de parcelas (CRUD + soft-delete) | Marcada ✓ (por hacer) |
| 3 | Servicio de cultivos (CRUD + cambio de estado) | Marcada ✓ (por hacer) |
| 4 | Servicio de datos de suelo (registro + historial) | Marcada ✓ (por hacer) |
| 5 | Cliente API climática (Open-Meteo + fallback OWM) | Marcada ✓ (por hacer) |
| 6 | Servicio de clima (actualización + isStale) | Marcada ✓ (por hacer) |
| 7 | Motor de alertas + servicio (umbrales + consolidación) | Marcada ✓ (por hacer) |
| 8 | Motor de recomendaciones + servicio (siembra/cosecha) | Marcada ✓ (por hacer) |
| 9 | Motor de recordatorios + servicio (riego/poda/fertilización) | Marcada ✓ (por hacer) |
| 10 | Sistema de errores y usage-logger | Marcada ✓ (por hacer) |

**Entregable**: Servicios completos, lógica agronómica funcionando con datos de prueba.

---

### Fase 3: API Routes + Cron Jobs (Semana 3-4)

**Objetivo**: Endpoints REST funcionales y jobs programados configurados.

| # | Tarea | Estado |
|---|---|---|
| 1 | Rutas de parcelas (GET, POST, PUT, DELETE) | Pendiente |
| 2 | Rutas de cultivos (GET, POST, PATCH status) | Pendiente |
| 3 | Rutas de datos de suelo y clima | Pendiente |
| 4 | Rutas de alertas y umbrales | Pendiente |
| 5 | Rutas de dashboard (resumen + detalle parcela) | Pendiente |
| 6 | Rutas de recomendaciones (GET + refresh) | Pendiente |
| 7 | Rutas de recordatorios (CRUD + complete) | Pendiente |
| 8 | Configurar `vercel.json` con cron jobs | Pendiente |
| 9 | Cron: actualización climática (cada 60 min) | Pendiente |
| 10 | Cron: recomendaciones (cada 24h) | Pendiente |
| 11 | Cron: recordatorios (cada 60 min) | Pendiente |

**Entregable**: API completa testeable con curl/Postman, crons configurados.

---

### Fase 4: Interfaz de Usuario (Semana 4-6)

**Objetivo**: UI mobile-first completa y funcional.

| # | Tarea | Estado |
|---|---|---|
| 1 | Layout principal + navegación mobile-first | Pendiente |
| 2 | Páginas de auth (login + registro) | Pendiente |
| 3 | Dashboard principal (resumen + cards + banners) | Pendiente |
| 4 | Páginas de parcelas (lista + crear + detalle) | Pendiente |
| 5 | Páginas de cultivos (lista + timeline) | Pendiente |
| 6 | Páginas de datos de suelo (historial + gráficos) | Pendiente |
| 7 | Página de alertas (lista + configuración umbrales) | Pendiente |
| 8 | Página de recomendaciones (cards + refresh) | Pendiente |
| 9 | Página de recordatorios (lista + formulario + completar) | Pendiente |

**Entregable**: App navegable end-to-end desde móvil y desktop.

---

### Fase 5: Integración, QA y Deploy (Semana 6-7)

**Objetivo**: App desplegada en producción, flujos validados.

| # | Tarea | Estado |
|---|---|---|
| 1 | Conectar Supabase remoto (aplicar migraciones + seed) | Pendiente |
| 2 | Configurar variables de entorno en Vercel | Pendiente |
| 3 | Deploy a Vercel (verificar build + crons) | Pendiente |
| 4 | Validar flujo completo: registro → parcela → cultivo → recomendación | Pendiente |
| 5 | Validar recordatorios automáticos y alertas | Pendiente |
| 6 | Pruebas en móvil (Chrome + Safari) | Pendiente |
| 7 | Ajustes de performance (carga < 3s en 3G) | Pendiente |
| 8 | Documentar README con instrucciones de setup | Pendiente |

**Entregable**: MVP en producción accesible vía URL de Vercel.

---

## Próximos Pasos Inmediatos

1. **Tú**: Crear el repo en GitHub y compartir el link
2. **Juntos**: Inicializar el proyecto Next.js y configurar la estructura
3. **Tú**: Crear proyecto en Supabase (free tier) y obtener las keys
4. **Juntos**: Aplicar migraciones y seed, implementar auth

## Notas

- Las tareas marcadas "Marcada ✓ (por hacer)" están definidas en `tasks.md` como completadas en diseño pero aún no se ha escrito código real.
- Empezaremos desde cero con la implementación real una vez tengas el repo y Supabase listos.
- La API de clima recomendada es **Open-Meteo** — no necesitas registrarte ni obtener API key para empezar.
- Si más adelante quieres el fallback de OpenWeatherMap, solo necesitas registrarte en openweathermap.org y poner la key en `.env`.
