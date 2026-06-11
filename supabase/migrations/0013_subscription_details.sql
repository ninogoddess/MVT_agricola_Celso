-- Agregar campos para manejar las suscripciones recurrentes de Mercado Pago (PreApproval)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mp_preapproval_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
