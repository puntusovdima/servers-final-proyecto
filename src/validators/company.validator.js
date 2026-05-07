import { z } from 'zod';

export const personalDataSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    nif: z.string().min(1, 'NIF is required').trim().toUpperCase()
});

const companyBaseSchema = z.object({
    name: z.string().min(1, 'Company name is required').trim(),
    address: z.object({
        street: z.string().optional(),
        number: z.string().optional(),
        postal: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional()
    })
});

export const companySchema = z.discriminatedUnion('isFreelance', [

    companyBaseSchema.extend({
        isFreelance: z.literal(true),
        cif: z.string().trim().toUpperCase().optional()
    }),

    companyBaseSchema.extend({
        isFreelance: z.literal(false),
        cif: z.string().min(1, 'CIF is required for non-freelance companies').trim().toUpperCase()
    })
]);
