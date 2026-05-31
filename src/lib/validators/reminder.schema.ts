import { z } from 'zod';

export const createReminderSchema = z.object({
  parcelaId: z.string().uuid('ID de parcela inválido'),
  cultivoId: z.string().uuid('ID de cultivo inválido').optional(),
  taskType: z.enum(['riego', 'poda', 'fertilizacion'], {
    message: 'Tipo debe ser: riego, poda o fertilizacion',
  }),
  scheduledAt: z.string().datetime('Fecha programada inválida'),
  source: z.literal('manual').optional(),
});

export const updateReminderSchema = z.object({
  scheduledAt: z.string().datetime('Fecha programada inválida').optional(),
  status: z.enum(['pending', 'completed']).optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
