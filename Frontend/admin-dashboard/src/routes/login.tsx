import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { setStoredAuth } from "@/lib/auth";

const REQUIRED_ROLE = "ADMIN";

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return "Request failed";
  }
  const data = payload as { message?: unknown };
  if (typeof data.message === "string") {
    return data.message;
  }
  if (typeof data.message === "object" && data.message) {
    const nested = data.message as { message?: unknown };
    if (typeof nested.message === "string") {
      return nested.message;
    }
    if (Array.isArray(nested.message)) {
      return nested.message.join(", ");
    }
  }
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }
  return "Request failed";
};

export const Route = createFileRoute("/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const onForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setError("");
    try {
      await fetch(buildApiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch {
      setError("Unable to reach the server.");
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }

      if (!payload?.user) {
        setError("Unexpected response from server.");
        return;
      }

      if (payload.user.role !== REQUIRED_ROLE) {
        setError("This account is not allowed to access the admin dashboard.");
        return;
      }

      setStoredAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });

      router.navigate({ to: "/" });
    } catch (err) {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/musicarth.png" alt="Musicarth" className="h-10 w-auto" draggable={false} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </span>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-[0_24px_70px_-20px_rgba(80,40,160,0.35)] backdrop-blur">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to manage Musicarth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button className="h-11 w-full text-base" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            {resetSent ? (
              <p className="text-center text-sm text-emerald-600">
                If that email exists, a reset link was sent. Check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={onForgotPassword}
                className="mx-auto block text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 Musicarth · Admin console
        </p>
      </div>
    </div>
  );
}
