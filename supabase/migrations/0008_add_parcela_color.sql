-- Agregar campo de color a parcelas para identificación visual
ALTER TABLE parcelas ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#16a34a';
