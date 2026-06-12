-- Corregir precios de planes según definición del negocio
-- Pro: $2.990 CLP / mes
-- Organizacion: $9.990 CLP / mes
UPDATE plans SET price_clp = 2990 WHERE id = 'pro';
UPDATE plans SET price_clp = 9990 WHERE id = 'organizacion';
UPDATE plans SET price_clp = 0 WHERE id = 'free';
