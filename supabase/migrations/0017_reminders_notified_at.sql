-- Evita reenviar la misma notificación push del recordatorio en cada corrida del
-- cron (que ahora corre cada 15 min). Marcamos cuándo se notificó cada recordatorio.
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_reminders_notified
  ON reminders (status, scheduled_at, notified_at);
