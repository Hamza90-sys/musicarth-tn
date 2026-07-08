// SSR-safe, zero-dependency error reporter. Sends crashes to Sentry only when
// VITE_SENTRY_DSN is set — a complete no-op otherwise (and never on the server).
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

type Parsed = { host: string; projectId: string; key: string; protocol: string };
let parsed: Parsed | null = null;
if (DSN) {
  try {
    const u = new URL(DSN);
    parsed = {
      protocol: u.protocol.replace(":", ""),
      host: u.host,
      key: u.username,
      projectId: u.pathname.replace(/^\//, ""),
    };
  } catch {
    parsed = null;
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(16)}${Math.floor(Math.random() * 1e16).toString(16)}`.padEnd(32, "0").slice(0, 32);
}

export function reportError(error: unknown, extra?: Record<string, unknown>) {
  if (!parsed || typeof window === "undefined") return;
  try {
    const message = error instanceof Error ? error.message : String(error);
    const event = {
      event_id: uuid(),
      timestamp: Date.now() / 1000,
      platform: "javascript",
      level: "error",
      environment: import.meta.env.MODE,
      exception: {
        values: [
          {
            type: error instanceof Error ? error.name : "Error",
            value: message,
            stacktrace: error instanceof Error && error.stack ? { frames: [] } : undefined,
          },
        ],
      },
      request: { url: window.location.href },
      extra: { ...extra, stack: error instanceof Error ? error.stack : undefined },
    };
    // Sentry envelope protocol (newline-delimited JSON items).
    const envelope =
      JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }) +
      "\n" +
      JSON.stringify({ type: "event" }) +
      "\n" +
      JSON.stringify(event);
    const endpoint = `${parsed.protocol}://${parsed.host}/api/${parsed.projectId}/envelope/?sentry_key=${parsed.key}&sentry_version=7`;
    fetch(endpoint, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope,
    }).catch(() => {});
  } catch {
    /* never let reporting throw */
  }
}

/** Attach global handlers. Call once on the client. */
export function initErrorReporting() {
  if (!parsed || typeof window === "undefined") return;
  window.addEventListener("error", (e) => reportError(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason ?? "Unhandled rejection"));
}
