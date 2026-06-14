import { z } from 'zod';

export const createFieldLogSchema = z.object({
  parcelaId: z.string().uuid('ID de parcela inválido'),
  cultivoId: z.string().uuid('ID de cultivo inválido').optional(),
  logDate: z.string().min(1, 'Fecha requerida'),
  category: z.enum(
    ['siembra', 'cosecha', 'riego', 'fertilizacion', 'poda', 'fitosanitario', 'labor', 'observacion', 'otro'],
    { message: 'Categoría inválida' }
  ),
  title: z.string().min(1, 'El título es obligatorio').max(160),
  notes: z.string().max(2000).optional(),
});

export const createTransactionSchema = z.object({
  parcelaId: z.string().uuid('ID de parcela inválido'),
  cultivoId: z.string().uuid('ID de cultivo inválido').optional(),
  type: z.enum(['income', 'expense'], { message: 'Tipo debe ser ingreso o gasto' }),
  category: z.string().min(1, 'Categoría requerida').max(40),
  amount: z.number().nonnegative('El monto no puede ser negativo'),
  description: z.string().max(200).optional(),
  transactionDate: z.string().min(1, 'Fecha requerida'),
});

export type CreateFieldLogInput = z.infer<typeof createFieldLogSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
