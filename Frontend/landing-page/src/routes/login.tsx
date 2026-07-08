import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginUser, type LoginResult } from "@/lib/api";
import { DASHBOARD_URLS } from "@/lib/dashboard-links";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const dashboardForRole = (role: LoginResult["user"]["role"]) => {
  if (role === "ADMIN") return DASHBOARD_URLS.admin;
  if (role === "INSTRUCTOR") return DASHBOARD_URLS.instructor;
  return DASHBOARD_URLS.student;
};

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-white";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      // Hand the session to the right dashboard (different origin) via the URL.
      const session = btoa(
        encodeURIComponent(
          JSON.stringify({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
          }),
        ),
      );
      window.location.href = `${dashboardForRole(result.user.role)}/#session=${session}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <a href="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </a>
          <img src="/musicarth.png" alt="Musicarth" className="mx-auto mt-6 h-9 w-auto object-contain" />
          <h1 className="mt-5 font-display text-3xl tracking-[-0.02em]">Welcome back</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Sign in and we&apos;ll take you to your dashboard.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-foreground/10 bg-white/70 p-6 shadow-soft sm:p-8"
        >
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Email</label>
            <input
              className={inputClass}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Password</label>
            <div className="relative">
              <input
                className={`${inputClass} pr-11`}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-foreground/60">
          New to Musicarth?{" "}
          <a href="/apply/student" className="text-primary hover:underline">
            Apply to join
          </a>
        </p>
      </div>
    </main>
  );
}
