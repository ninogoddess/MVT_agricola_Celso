-- payment_logs tenía RLS habilitado pero SIN política de INSERT,
-- por lo que las inserciones desde contexto de usuario (checkout) se bloqueaban
-- silenciosamente. Agregamos política de INSERT para miembros del tenant.
DROP POLICY IF EXISTS "Payment logs insertables por miembros del tenant" ON payment_logs;
CREATE POLICY "Payment logs insertables por miembros del tenant"
ON payment_logs FOR INSERT
TO authenticated
WITH CHECK (tenant_id IN (
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
));
