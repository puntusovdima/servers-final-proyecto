import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  number: z.string().min(1, 'Number is required'),
  postal: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required')
});

export const createProjectSchema = z.object({
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID'),
  name: z.string().min(1, 'Name is required'),
  projectCode: z.string().min(1, 'Project code is required'),
  email: z.string().email('Invalid email address format'),
  address: addressSchema,
  notes: z.string().optional()
});

export const updateProjectSchema = createProjectSchema.partial();
