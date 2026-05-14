import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const workersField = z.array(objectId).optional();
const commonFields = {
  project: objectId,
  client: objectId,
  description: z.string().min(1, 'Description is required'),
  workDate: z.string().transform((val) => new Date(val))
};

const materialNoteSchema = z.object({
  ...commonFields,
  format: z.literal('material'),
  material: z.string().min(1, 'Material is required for material format'),
  hours: z.number().positive().optional(),
  workers: workersField
});

const hoursNoteSchema = z.object({
  ...commonFields,
  format: z.literal('hours'),
  hours: z.number().positive('Hours must be a positive number'),
  material: z.string().optional(),
  workers: workersField
});

export const createDeliveryNoteSchema = z.discriminatedUnion('format', [
  materialNoteSchema,
  hoursNoteSchema
]);

export const updateDeliveryNoteSchema = z.object({
  project: objectId.optional(),
  client: objectId.optional(),
  format: z.enum(['material', 'hours']).optional(),
  material: z.string().optional(),
  hours: z.number().positive().optional(),
  workers: workersField,
  description: z.string().min(1).optional(),
  workDate: z.string().transform((val) => new Date(val)).optional()
});
