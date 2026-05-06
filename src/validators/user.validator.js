import { z } from 'zod';

// Schema for Point 1: Registration
export const registerSchema = z.object({
    email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase()),
    password: z.string().min(8, 'Password must be at least 8 characters long')
});

// Schema for Point 2: Email Validation
export const validationSchema = z.object({
    code: z.string().length(6, 'Verification code must be exactly 6 characters')
});

// Schema for Point 3: Login
export const loginSchema = z.object({
    email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase()),
    password: z.string().min(1, 'Password is required')
});

// Point 9: Change Password
export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long')
}).refine(data => data.oldPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
});

// Point 10: Invite Peer
export const inviteSchema = z.object({
    email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase())
});
