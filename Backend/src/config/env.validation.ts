type Environment = Record<string, string | undefined>;

function getRequired(env: Environment, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getNumber(env: Environment, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

export function validateEnvironment(env: Environment) {
  return {
    NODE_ENV: env.NODE_ENV ?? 'development',
    PORT: getNumber(env, 'PORT', 4000),
    API_PREFIX: env.API_PREFIX ?? 'api/v1',
    DATABASE_URL: getRequired(env, 'DATABASE_URL'),
    REDIS_HOST: env.REDIS_HOST ?? '127.0.0.1',
    REDIS_PORT: getNumber(env, 'REDIS_PORT', 6379),
    REDIS_PASSWORD: env.REDIS_PASSWORD ?? '',
    REDIS_DB: getNumber(env, 'REDIS_DB', 0),
    SESSION_REMINDERS_ENABLED: env.SESSION_REMINDERS_ENABLED ?? 'true',
    JWT_ACCESS_SECRET: getRequired(env, 'JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: getRequired(env, 'JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRES_IN: env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    BCRYPT_SALT_ROUNDS: getNumber(env, 'BCRYPT_SALT_ROUNDS', 12),
    CORS_ORIGINS: env.CORS_ORIGINS ?? '',
    RATE_LIMIT_WINDOW_MS: getNumber(env, 'RATE_LIMIT_WINDOW_MS', 60_000),
    RATE_LIMIT_MAX_REQUESTS: getNumber(env, 'RATE_LIMIT_MAX_REQUESTS', 120),
    MEILI_HOST: env.MEILI_HOST ?? '',
    MEILI_API_KEY: env.MEILI_API_KEY ?? '',
    STORAGE_BASE_URL: env.STORAGE_BASE_URL ?? '',
    MEDIA_SIGNING_SECRET: env.MEDIA_SIGNING_SECRET ?? '',
    MUX_TOKEN_ID: env.MUX_TOKEN_ID ?? '',
    MUX_TOKEN_SECRET: env.MUX_TOKEN_SECRET ?? '',
    MUX_SIGNING_KEY_ID: env.MUX_SIGNING_KEY_ID ?? '',
    MUX_SIGNING_PRIVATE_KEY: env.MUX_SIGNING_PRIVATE_KEY ?? '',
    MUX_WEBHOOK_SECRET: env.MUX_WEBHOOK_SECRET ?? '',
    DAILY_API_KEY: env.DAILY_API_KEY ?? '',
    DAILY_DOMAIN: env.DAILY_DOMAIN ?? '',
    STUDENT_APP_URL: env.STUDENT_APP_URL ?? 'http://localhost:5174',
    INSTRUCTOR_APP_URL: env.INSTRUCTOR_APP_URL ?? 'http://localhost:5175',
    RESEND_API_KEY: env.RESEND_API_KEY ?? '',
    MAIL_FROM: env.MAIL_FROM ?? 'MUSIQA <onboarding@musiqa.local>',
  };
}
