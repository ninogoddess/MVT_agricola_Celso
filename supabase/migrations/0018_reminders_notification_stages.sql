-- Notificaciones en 3 etapas por recordatorio: 24 h, 2 h y 15 min antes.
-- Cada columna marca cuándo se envió esa etapa, para no repetir el envío en cada
-- corrida del cron (que corre cada 15 min).
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notified_24h_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notified_2h_at  TIMESTAMP WITH TIME ZONE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notified_15m_at TIMESTAMP WITH TIME ZONE;

-- La columna notified_at de la migración 0017 queda obsoleta (reemplazada por las
-- tres etapas). La conservamos para no romper datos existentes.

CREATE INDEX IF NOT EXISTS idx_reminders_notif_stages
  ON reminders (status, scheduled_at);
