import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Flame, Sparkles, Award, Play, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { useStoredAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type Stats = { totalXp: number; currentStreak: number; badgeCount: number };
type Enrollment = {
  id: string;
  progress: number;
  status: "ACTIVE" | "COMPLETED";
  course: { id: string; title: string; isPublished: boolean };
};
type EnrollmentsResponse = { data: Enrollment[] };
type LiveSession = {
  id: string;
  title: string;
  startsAt: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  instructor: { fullName: string };
};
type Course = {
  id: string;
  title: string;
  level: string;
  isPublished: boolean;
  sections: { lessons: { id: string }[] }[];
};

const hues = [
  "from-primary/20 to-primary/5",
  "from-fuchsia-500/20 to-primary/5",
  "from-violet-500/25 to-primary/5",
  "from-indigo-500/20 to-primary/5",
  "from-purple-500/25 to-primary/5",
];

function Dashboard() {
  const auth = useStoredAuth();
  const firstName = auth?.user.fullName?.split(" ").filter(Boolean)[0] ?? "there";

  const statsQuery = useQuery({
    queryKey: ["student-stats"],
    queryFn: () => apiFetch<Stats>("/users/me/stats"),
  });
  const enrollmentsQuery = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => apiFetch<EnrollmentsResponse>("/enrollments/me"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["student-sessions"],
    queryFn: () => apiFetch<LiveSession[]>("/users/me/sessions"),
  });
  const coursesQuery = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => apiFetch<Course[]>("/courses"),
  });

  const enrollments = enrollmentsQuery.data?.data ?? [];
  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => e.course.id)),
    [enrollments],
  );
  const upcoming = (sessionsQuery.data ?? []).filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE",
  );
  const recommended = (coursesQuery.data ?? [])
    .filter((c) => c.isPublished && !enrolledIds.has(c.id))
    .slice(0, 6);
  const resumeCourseId = enrollments.find((e) => e.status === "ACTIVE")?.course.id;

  const stats = [
    { label: "XP Points", value: statsQuery.data?.totalXp ?? 0, icon: Sparkles },
    { label: "Day Streak", value: statsQuery.data?.currentStreak ?? 0, icon: Flame },
    { label: "Badges", value: statsQuery.data?.badgeCount ?? 0, icon: Award },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 md:space-y-8 md:px-8 md:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up a lesson or explore something new.
          </p>
        </div>
        {resumeCourseId ? (
          <Button asChild className="gap-2 shadow-[var(--shadow-elegant)]">
            <Link to="/courses/$courseId" params={{ courseId: resumeCourseId }}>
              <Play className="h-4 w-4" />
              Resume learning
            </Link>
          </Button>
        ) : (
          <Button asChild className="gap-2 shadow-[var(--shadow-elegant)]">
            <Link to="/courses">
              <Play className="h-4 w-4" />
              Browse courses
            </Link>
          </Button>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {statsQuery.isLoading ? "…" : s.value}
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

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <Link to="/courses">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollmentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your courses…</p>
            ) : enrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                You haven&apos;t enrolled in any course yet.{" "}
                <Link to="/courses" className="text-primary hover:underline">
                  Browse the catalogue
                </Link>
                .
              </div>
            ) : (
              enrollments.map((e) => (
                <Link
                  key={e.id}
                  to="/courses/$courseId"
                  params={{ courseId: e.course.id }}
                  className="group flex items-center gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.65_0.22_293.5)] text-primary-foreground">
                    <Play className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{e.course.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{e.progress}%</span>
                    </div>
                    <Progress value={e.progress} className="mt-2 h-1.5" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            <CardDescription>Live with instructors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No upcoming sessions.{" "}
                <Link to="/sessions" className="text-primary hover:underline">
                  Book one
                </Link>
                .
              </div>
            ) : (
              upcoming.map((s) => (
                <div key={s.id} className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.instructor.fullName}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(s.startsAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-7">
                      <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                        Open
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
            <p className="text-sm text-muted-foreground">Published courses you haven&apos;t taken</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Link to="/courses">
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        {recommended.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            No new courses to recommend right now.
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-3">
              {recommended.map((r, i) => {
                const lessons = r.sections.reduce((sum, sec) => sum + sec.lessons.length, 0);
                return (
                  <Card
                    key={r.id}
                    className="w-64 shrink-0 overflow-hidden border-border/60 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
                  >
                    <div className={`flex h-28 items-end bg-gradient-to-br ${hues[i % hues.length]} p-4`}>
                      <Badge variant="secondary" className="bg-background/80 text-xs font-medium backdrop-blur">
                        {r.level}
                      </Badge>
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <p className="whitespace-normal font-medium leading-tight">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{lessons} lessons</p>
                      <Button asChild variant="ghost" size="sm" className="w-full justify-between px-0 text-primary hover:bg-transparent hover:text-primary">
                        <Link to="/courses/$courseId" params={{ courseId: r.id }}>
                          Start course <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </section>
    </div>
  );
}
