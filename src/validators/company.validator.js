import { z } from 'zod';

/**
 * Validation schema for updating user's personal data (Point 4).
 */
export const personalDataSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    nif: z.string().min(1, 'NIF is required').trim().toUpperCase()
});

/**
 * Validation schema for associating a company (Point 4).
 */
/**
 * Base schema for company data shared between freelance and standard companies.
 */
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

/**
 * Validation schema for associating a company (Point 4).
 * Uses a discriminatedUnion to enforce CIF only when isFreelance is false.
 */
export const companySchema = z.discriminatedUnion('isFreelance', [
    // Case: Freelancer (isFreelance = true)
    companyBaseSchema.extend({
        isFreelance: z.literal(true),
        cif: z.string().trim().toUpperCase().optional() // CIF is optional as it defaults to User's NIF
    }),
    // Case: Standard Company (isFreelance = false)
    companyBaseSchema.extend({
        isFreelance: z.literal(false),
        cif: z.string().min(1, 'CIF is required for non-freelance companies').trim().toUpperCase()
    })
]);
