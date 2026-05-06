import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().url().default('mongodb://localhost:27017/test'),
  JWT_SECRET: z.string().min(32).default('a'.repeat(32)),
  JWT_REFRESH_SECRET: z.string().min(32).default('b'.repeat(32)),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Slack
  SLACK_WEBHOOK: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),

  // Mail (from intermedia)
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
