-- Ajuste de límites de planes para una propuesta de valor coherente.
-- Gratis: para probar el sistema con una parcela.
-- Pro: pensado para productores con varias parcelas/cultivos.
UPDATE plans SET max_plots = 1,  max_crops = 5,   max_reminders = 5    WHERE id = 'free';
UPDATE plans SET max_plots = 10, max_crops = 50,  max_reminders = 100  WHERE id = 'pro';
UPDATE plans SET max_plots = 100, max_crops = 1000, max_reminders = 1000 WHERE id = 'organizacion';
