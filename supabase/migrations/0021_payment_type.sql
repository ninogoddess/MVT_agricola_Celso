-- Distingue el tipo de cobro de cada suscripción:
--   'subscription' = débito automático recurrente (PreApproval, solo tarjetas de crédito)
--   'oneshot'      = pago mensual manual (Checkout Pro/Preference, acepta débito, CuentaRUT, etc.)
-- Para 'oneshot', next_billing_date funciona como fecha de vencimiento del plan.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) NOT NULL DEFAULT 'subscription';
