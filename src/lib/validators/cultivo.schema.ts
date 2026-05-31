import { z } from 'zod';

export const createCultivoSchema = z.object({
  species: z.string().min(1, 'La especie es obligatoria').max(255),
  variety: z.string().max(255).optional(),
  plantingDate: z.string().date('Fecha de siembra inválida'),
  estimatedHarvestDate: z.string().date('Fecha de cosecha inválida').optional(),
});

export const updateCultivoStatusSchema = z.object({
  status: z.enum(['active', 'harvested', 'lost'], {
    message: 'Estado debe ser: active, harvested o lost',
  }),
});

export type CreateCultivoInput = z.infer<typeof createCultivoSchema>;
export type UpdateCultivoStatusInput = z.infer<typeof updateCultivoStatusSchema>;
