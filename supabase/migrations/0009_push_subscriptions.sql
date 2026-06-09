-- Tabla de suscripciones push (Web Push VAPID)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_tenant ON push_subscriptions(tenant_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_select ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY push_insert ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY push_delete ON push_subscriptions FOR DELETE USING (user_id = auth.uid());
