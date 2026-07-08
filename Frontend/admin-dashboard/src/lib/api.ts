import { getStoredAuth, setStoredAuth, clearStoredAuth } from "./auth";

const rawBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const buildApiUrl = (path: string) => {
  if (!path) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const parseMessage = (payload: unknown): string => {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return "Request failed";
};

export const authHeaders = (): Record<string, string> => {
  const auth = getStoredAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
};

const rawFetch = (path: string, init: RequestInit, token?: string) => {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(buildApiUrl(path), { ...init, headers });
};

// De-duplicate concurrent refreshes so a burst of 401s only refreshes once.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) return Promise.resolve(null);
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(buildApiUrl("/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: auth.refreshToken }),
        });
        if (!res.ok) {
          clearStoredAuth();
          return null;
        }
        const data = await res.json().catch(() => null);
        if (!data?.accessToken) {
          clearStoredAuth();
          return null;
        }
        setStoredAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? auth.refreshToken,
          user: data.user ?? auth.user,
        });
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth();
  let response = await rawFetch(path, init, auth?.accessToken);

  // Access token expired → silently refresh once and retry the request.
  if (response.status === 401 && auth?.refreshToken && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) response = await rawFetch(path, init, newToken);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(parseMessage(payload), response.status);
  return payload as T;
}
