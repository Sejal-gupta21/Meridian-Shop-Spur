import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  DATABASE_PATH: z.string().default('./data/chat.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MAX_MESSAGE_LENGTH: z.string().default('5000'),
  MAX_HISTORY_MESSAGES: z.string().default('20'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid or missing environment variables:');
  parsed.error.errors.forEach((e) => {
    console.error(`   • ${e.path.join('.')}: ${e.message}`);
  });
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  geminiApiKey: parsed.data.GEMINI_API_KEY,
  databasePath: parsed.data.DATABASE_PATH,
  corsOrigin: parsed.data.CORS_ORIGIN,
  maxMessageLength: parseInt(parsed.data.MAX_MESSAGE_LENGTH, 10),
  maxHistoryMessages: parseInt(parsed.data.MAX_HISTORY_MESSAGES, 10),
};
