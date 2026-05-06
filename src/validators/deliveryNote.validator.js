import { z } from 'zod';

const baseDeliveryNoteSchema = z.object({
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Project ID'),
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID'),
  format: z.enum(['material', 'hours']),
  material: z.string().optional(),
  hours: z.number().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  workDate: z.string().transform((val) => new Date(val))
});

export const createDeliveryNoteSchema = baseDeliveryNoteSchema.refine((data) => {
  if (data.format === 'material' && !data.material) return false;
  if (data.format === 'hours' && !data.hours) return false;
  return true;
}, {
  message: 'Material is required for material format, and Hours is required for hours format',
  path: ['format']
});

export const updateDeliveryNoteSchema = baseDeliveryNoteSchema.partial();
