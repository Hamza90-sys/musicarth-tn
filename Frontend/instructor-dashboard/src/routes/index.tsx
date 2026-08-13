import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Instructor Dashboard — Musicarth" }],
  }),
  component: InstructorDashboard,
});

type DashboardCourse = {
  id: string;
  title: string;
  instrument: string;
  isPublished: boolean;
  price: number | null;
  instructor: { id: string } | null;
  sections: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
};
type DashboardSession = {
  id: string;
  title: string;
  instrument: string;
  startsAt: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  student: { fullName: string } | null;
};
type Earnings = {
  feePercent: number;
  totalSales: number;
  totalNetMillimes: number;
  monthNetMillimes: number;
  paidOutMillimes: number;
  pendingPayoutMillimes: number;
  courses: { courseId: string; title: string; sales: number; netMillimes: number }[];
  recent: { id: string; courseTitle: string; buyer: string; netMillimes: number; createdAt: string }[];
};

function InstructorDashboard() {
  const { t } = useI18n();
  const auth = getStoredAuth();
  const firstName = auth?.user.fullName?.split(" ").filter(Boolean)[0] ?? "Instructor";

  const coursesQuery = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: () => apiFetch<DashboardCourse[]>("/courses"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["instructor-sessions"],
    queryFn: () => apiFetch<DashboardSession[]>("/users/me/sessions"),
  });
  const earningsQuery = useQuery({
    queryKey: ["instructor-earnings"],
    queryFn: () => apiFetch<Earnings>("/payments/earnings/me"),
  });
  const earnings = earningsQuery.data;
  const tnd = (millimes: number) => `${(millimes / 1000).toFixed(millimes % 1000 === 0 ? 0 : 3)} TND`;

  const myCourses = useMemo(() => {
    const all = coursesQuery.data ?? [];
    if (!auth?.user.id) return all;
    return all.filter((c) => c.instructor?.id === auth.user.id);
  }, [coursesQuery.data, auth?.user.id]);

  const totalStudents = myCourses.reduce((sum, c) => sum + c.enrollments.length, 0);
  const published = myCourses.filter((c) => c.isPublished).length;
  const upcoming = (sessionsQuery.data ?? []).filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE",
  );

  const stats = [
    { label: "Courses", value: myCourses.length, icon: BookOpen },
    { label: "Published", value: published, icon: CheckCircle2 },
    { label: "Students", value: totalStudents, icon: Users },
    { label: "Upcoming sessions", value: upcoming.length, icon: CalendarDays },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 md:space-y-8 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("welcomeBack")}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your courses and manage your live sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/courses">
              <BookOpen className="h-4 w-4" /> My courses
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/sessions">
              <CalendarDays className="h-4 w-4" /> Manage sessions
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {coursesQuery.isLoading ? "…" : s.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">{t("earnings")}</CardTitle>
          <CardDescription>
            Your {earnings ? 100 - earnings.feePercent : 70}% share of every course sale
            (Musicarth keeps {earnings ? earnings.feePercent : 30}%). Payouts are settled manually for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earningsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading earnings…</p>
          ) : !earnings || earnings.totalSales === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No sales yet. When students buy your paid courses, your earnings appear here.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Total earned</p>
                  <p className="mt-1 text-2xl font-semibold">{tnd(earnings.totalNetMillimes)}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">This month</p>
                  <p className="mt-1 text-2xl font-semibold">{tnd(earnings.monthNetMillimes)}</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs text-primary">Pending payout</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {tnd(earnings.pendingPayoutMillimes)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Sales</p>
                  <p className="mt-1 text-2xl font-semibold">{earnings.totalSales}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pending payout is what Musicarth still owes you. It's transferred to your saved
                payout account at the end of each month —{" "}
                <Link to="/profile" className="text-primary hover:underline">
                  add your bank / Flouci details
                </Link>
                .
              </p>
              {earnings.courses.length > 0 ? (
                <div className="space-y-2">
                  {earnings.courses.map((c) => (
                    <div
                      key={c.courseId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{c.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {c.sales} sale{c.sales === 1 ? "" : "s"} · <span className="font-semibold text-foreground">{tnd(c.netMillimes)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">My courses</CardTitle>
              <CardDescription>Courses assigned to you on Musicarth.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <Link to="/courses">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {coursesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : myCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No courses assigned to you yet. The Musicarth team builds courses — yours will
                appear here once assigned.
              </div>
            ) : (
              myCourses.slice(0, 5).map((c) => {
                const lessons = c.sections.reduce((sum, s) => sum + s.lessons.length, 0);
                return (
                  <Link
                    key={c.id}
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.instrument} · {lessons} lessons · {c.enrollments.length} students
                      </p>
                    </div>
                    <Badge variant={c.isPublished ? "default" : "outline"}>
                      {c.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming sessions</CardTitle>
            <CardDescription>Your scheduled live lessons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No upcoming sessions.
              </div>
            ) : (
              upcoming.slice(0, 5).map((s) => (
                <div key={s.id} className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.student?.fullName ?? "Open slot"}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(s.startsAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
