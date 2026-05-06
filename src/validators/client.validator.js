import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  number: z.string().min(1, 'Number is required'),
  postal: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required')
});

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cif: z.string().min(1, 'CIF is required'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().min(1, 'Phone is required'),
  address: addressSchema
});

export const updateClientSchema = createClientSchema.partial();
