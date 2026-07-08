const rawBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const buildUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const parseError = (payload: unknown): string => {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return "Something went wrong. Please try again.";
};

export type StudentApplication = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address?: string;
  instruments?: string;
  motivation?: string;
};

export async function submitStudentApplication(data: StudentApplication) {
  const response = await fetch(buildUrl("/applications/student"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(parseError(payload));
  return payload;
}

export type LoginResult = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  };
};

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(parseError(payload));
  return payload as LoginResult;
}

/** Instructor application is multipart because it carries the CV PDF. */
export async function submitInstructorApplication(form: FormData) {
  const response = await fetch(buildUrl("/applications/instructor"), {
    method: "POST",
    body: form, // browser sets multipart boundary; don't set Content-Type
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(parseError(payload));
  return payload;
}
