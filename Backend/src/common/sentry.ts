import * as Sentry from '@sentry/node';

let enabled = false;

/**
 * Initialises Sentry only when SENTRY_DSN is configured. A no-op otherwise, so
 * local dev and un-configured environments run exactly as before.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Error monitoring only — no performance tracing by default (keep it cheap).
    tracesSampleRate: 0,
  });
  enabled = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!enabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
