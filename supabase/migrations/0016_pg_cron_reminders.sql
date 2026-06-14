-- ============================================================================
-- Notificaciones push de recordatorios cada 15 minutos (plan gratuito)
-- ----------------------------------------------------------------------------
-- PROBLEMA: en Vercel Hobby los cron jobs corren solo 1 vez al día, por lo que
-- el envío push de recordatorios (ventana de 2 h) casi nunca coincide.
--
-- SOLUCIÓN: usar pg_cron + pg_net (extensiones gratuitas de Supabase) para llamar
-- al endpoint /api/cron/reminders de la app cada 15 minutos. Ese endpoint envía
-- las notificaciones push reales (VAPID) a los dispositivos suscritos, lo que
-- funciona aunque la PWA esté cerrada en Android.
--
-- IMPORTANTE (pasos manuales antes de aplicar):
--   1. Reemplaza <TU_DOMINIO> por tu dominio real (ej: agrencia.vercel.app).
--   2. Reemplaza <CRON_SECRET> por el mismo valor que tienes en las variables de
--      entorno de Vercel (CRON_SECRET).
--   3. Aplica esta migración en el SQL Editor de Supabase.
-- ============================================================================

-- Habilitar extensiones (idempotente).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar el job previo si existe (para reaplicar sin duplicar).
DO $$
BEGIN
  PERFORM cron.unschedule('reminders-push-every-15min');
EXCEPTION WHEN OTHERS THEN
  -- el job no existía, ignorar
  NULL;
END $$;

-- Programar la llamada HTTP cada 15 minutos.
SELECT cron.schedule(
  'reminders-push-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://<TU_DOMINIO>/api/cron/reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
  $$
);

-- Para verificar el job:   SELECT * FROM cron.job;
-- Para ver el historial:   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Para desactivarlo:       SELECT cron.unschedule('reminders-push-every-15min');
