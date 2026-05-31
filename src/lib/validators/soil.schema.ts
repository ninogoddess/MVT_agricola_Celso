import { z } from 'zod';

export const createSoilDataSchema = z.object({
  measurementDate: z.string().date('Fecha de medición inválida'),
  ph: z.number().min(0, 'El pH debe ser entre 0 y 14').max(14, 'El pH debe ser entre 0 y 14'),
  humidityPercent: z.number()
    .min(0, 'La humedad debe ser entre 0% y 100%')
    .max(100, 'La humedad debe ser entre 0% y 100%'),
  nitrogenLevel: z.number().optional(),
  phosphorusLevel: z.number().optional(),
  potassiumLevel: z.number().optional(),
});

export type CreateSoilDataInput = z.infer<typeof createSoilDataSchema>;
