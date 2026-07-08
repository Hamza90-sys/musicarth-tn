const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

const withPath = (base: string, path = "") => `${trimTrailingSlash(base)}${path}`;

export const DASHBOARD_URLS = {
  student: withPath(
    import.meta.env.VITE_STUDENT_DASHBOARD_URL ?? "http://localhost:5174",
  ),
  instructor: withPath(
    import.meta.env.VITE_INSTRUCTOR_DASHBOARD_URL ?? "http://localhost:5175",
  ),
  admin: withPath(
    import.meta.env.VITE_ADMIN_DASHBOARD_URL ?? "http://localhost:5176",
  ),
};
