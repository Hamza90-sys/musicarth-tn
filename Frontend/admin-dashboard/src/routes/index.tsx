import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Flag,
  Award,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: AdminDashboard,
});

type Analytics = {
  users: number;
  instructors: number;
  courses: number;
  publishedCourses: number;
  sessions: number;
  reports: number;
  badges: number;
};

type Application = { id: string; status: string };

function AdminDashboard() {
  const auth = getStoredAuth();
  const firstName = auth?.user.fullName?.split(" ").filter(Boolean)[0] ?? "Admin";

  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<Analytics>("/admin/analytics"),
  });
  const pendingQuery = useQuery({
    queryKey: ["admin-applications", "PENDING"],
    queryFn: () => apiFetch<Application[]>("/admin/applications?status=PENDING"),
  });

  const a = analyticsQuery.data;
  const pendingCount = pendingQuery.data?.length ?? 0;

  const stats = [
    { label: "Total users", value: a?.users, icon: Users },
    { label: "Instructors", value: a?.instructors, icon: GraduationCap },
    { label: "Courses", value: a?.courses, sub: a ? `${a.publishedCourses} published` : "", icon: BookOpen },
    { label: "Live sessions", value: a?.sessions, icon: CalendarDays },
    { label: "Open reports", value: a?.reports, icon: Flag },
    { label: "Badges", value: a?.badges, icon: Award },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 md:space-y-8 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across Musicarth.
        </p>
      </div>

      {/* Pending applications callout */}
      <Card
        className={`border-border/60 shadow-[var(--shadow-card)] ${
          pendingCount > 0 ? "bg-primary/5" : ""
        }`}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {pendingQuery.isLoading ? "…" : pendingCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {pendingCount === 1 ? "application" : "applications"} waiting for review
              </p>
            </div>
          </div>
          <Button asChild className="gap-2">
            <Link to="/applications">
              Review applications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Platform stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {analyticsQuery.isLoading ? "…" : (s.value ?? 0)}
                  </p>
                  {s.sub ? <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p> : null}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {analyticsQuery.error ? (
        <p className="text-sm text-destructive">
          Could not load platform analytics. Make sure you are signed in as an admin.
        </p>
      ) : null}
    </div>
  );
}
