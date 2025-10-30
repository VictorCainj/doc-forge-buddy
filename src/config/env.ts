/**
 * Validação e tipagem de variáveis de ambiente
 * Garante que todas as variáveis necessárias estão presentes e válidas
 */
import { z } from 'zod';

/**
 * Schema de validação para variáveis de ambiente
 */
const envSchema = z.object({
  // Supabase (obrigatório)
  VITE_SUPABASE_URL: z.string().url({
    message: 'VITE_SUPABASE_URL deve ser uma URL válida',
  }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(32, {
    message: 'VITE_SUPABASE_PUBLISHABLE_KEY deve ter pelo menos 32 caracteres',
  }),

  // OpenAI (opcional)
  VITE_OPENAI_API_KEY: z.string().optional(),

  // Sentry (opcional para produção)
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_ORG: z.string().optional(),
  VITE_SENTRY_PROJECT: z.string().optional(),
  VITE_SENTRY_AUTH_TOKEN: z.string().optional(),

  // Ambiente
  MODE: z.enum(['development', 'production', 'test']).optional(),
  PROD: z.boolean().optional(),
  DEV: z.boolean().optional(),
});

/**
 * Variáveis de ambiente validadas e tipadas
 * Lança erro se alguma variável obrigatória estiver faltando ou inválida
 */
export const env = envSchema.parse(import.meta.env);

/**
 * Validação das variáveis obrigatórias com mensagens de erro amigáveis
 */
export function validateEnv() {
  try {
    envSchema.parse(import.meta.env);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path[0]);
      throw new Error(
        `Variáveis de ambiente inválidas: ${missingVars.join(', ')}\n${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Helpers para verificar se recursos estão disponíveis
 */
export const hasOpenAI = () => !!env.VITE_OPENAI_API_KEY;
export const hasSentry = () =>
  !!(
    env.VITE_SENTRY_DSN &&
    env.VITE_SENTRY_ORG &&
    env.VITE_SENTRY_PROJECT &&
    env.VITE_SENTRY_AUTH_TOKEN
  );
export const isDev = () => env.DEV === true;
export const isProd = () => env.PROD === true;
