-- Añadir columna name a cultivos para identificar cultivos específicos
ALTER TABLE cultivos ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Comentario para documentación
COMMENT ON COLUMN cultivos.name IS 'Nombre opcional para identificar un cultivo específico dentro de una parcela';
