import { z } from 'zod';

export const createParcelaSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  latitude: z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90, 'Latitud debe estar entre -90 y 90'),
  longitude: z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180, 'Longitud debe estar entre -180 y 180'),
  areaHectares: z.number().positive('La superficie debe ser mayor a 0'),
});

export const updateParcelaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  areaHectares: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser un valor hexadecimal válido').optional(),
});

export type CreateParcelaInput = z.infer<typeof createParcelaSchema>;
export type UpdateParcelaInput = z.infer<typeof updateParcelaSchema>;
