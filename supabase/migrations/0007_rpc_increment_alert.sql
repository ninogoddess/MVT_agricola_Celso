-- Función RPC para incrementar el contador de alertas agrupadas
CREATE OR REPLACE FUNCTION increment_alert_count(alert_id UUID)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE alerts
  SET grouped_count = grouped_count + 1
  WHERE id = alert_id;
$$;
