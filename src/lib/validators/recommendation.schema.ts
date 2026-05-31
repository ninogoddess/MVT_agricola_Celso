import { z } from 'zod';

export const refreshRecommendationSchema = z.object({
  cultivoId: z.string().uuid('ID de cultivo inválido').optional(),
  type: z.enum(['siembra', 'cosecha'], {
    message: 'Tipo debe ser: siembra o cosecha',
  }),
});

export type RefreshRecommendationInput = z.infer<typeof refreshRecommendationSchema>;
