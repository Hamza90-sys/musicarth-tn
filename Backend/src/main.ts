import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { initSentry } from './common/sentry';
import { RedisService } from './redis/redis.service';

async function bootstrap() {
  // Must run before anything else so early errors are captured too.
  initSentry();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const allowedOrigins = (configService.get<string>('CORS_ORIGINS', '') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Fail closed: in production an empty CORS_ORIGINS would mean "allow every
  // origin with credentials" — refuse to boot instead of shipping that.
  if (configService.get<string>('NODE_ENV') === 'production' && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production (comma-separated frontend origins)');
  }

  // Cap request bodies. Course covers/avatars arrive as data-URLs (~1.5MB max
  // after client-side resize), so 3mb leaves headroom without allowing abuse.
  app.useBodyParser('json', { limit: '3mb' });
  const rateWindowMs = configService.get<number>('RATE_LIMIT_WINDOW_MS', 60_000);
  const rateLimitMax = configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 120);
  // Stricter limit for auth endpoints to slow brute-force (spec §13).
  const AUTH_WINDOW_MS = 15 * 60 * 1000;
  const AUTH_MAX = configService.get<number>('AUTH_RATE_LIMIT_MAX', 12);
  const requestBuckets = new Map<string, { count: number; resetAt: number }>();

  // Periodically evict expired buckets so the map can't grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of requestBuckets) {
      if (bucket.resetAt <= now) requestBuckets.delete(key);
    }
  }, 60_000);
  sweep.unref?.();

  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api/v1'));
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });
  // Secure headers. CSP is off (this is a JSON API), and CORP is cross-origin so
  // the dashboards (different origins) can fetch CV / certificate PDFs + avatars.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Rate limiter: prefers a Redis counter (shared across all instances), and
  // falls back to the in-memory buckets if Redis is unavailable, so a single
  // box is still protected and a Redis hiccup never locks users out.
  const redisService = app.get(RedisService, { strict: false });
  const tooMany = (res: any) =>
    res.status(429).json({
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      error: 'Too Many Requests',
    });
  const localHit = (key: string, windowMs: number): number => {
    const now = Date.now();
    const bucket = requestBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }
    bucket.count += 1;
    return bucket.count;
  };
  app.use(async (req: any, res: any, next: () => void) => {
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown';
    const isAuth = typeof req.path === 'string' && req.path.includes('/auth/');
    const max = isAuth ? AUTH_MAX : rateLimitMax;
    const windowMs = isAuth ? AUTH_WINDOW_MS : rateWindowMs;
    const key = `${ip}:${isAuth ? 'auth' : req.method}:${req.path}`;

    const redisCount = redisService
      ? await redisService.rateLimitHit(`rl:${key}`, Math.ceil(windowMs / 1000))
      : null;
    const count = redisCount ?? localHit(key, windowMs);

    if (count > max) return tooMany(res);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
}

void bootstrap();
