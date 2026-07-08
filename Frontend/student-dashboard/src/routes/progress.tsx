import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Flame, Award, Trophy, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { useStoredAuth } from "@/lib/auth";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

type Stats = {
  totalXp: number;
  level: number;
  levelName: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
  enrollmentCount: number;
};
type UserBadge = {
  id: string;
  awardedAt: string;
  badge: { code: string; title: string; description: string; icon: string | null };
};
type LeaderboardRow = {
  rank: number;
  xp: number;
  user: { id: string; fullName: string; avatarUrl: string | null; role: string };
};
type Leaderboard = { instrument: string | null; items: LeaderboardRow[] };

const initials = (n?: string) =>
  (n ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

function ProgressPage() {
  const auth = useStoredAuth();
  const statsQuery = useQuery({ queryKey: ["student-stats"], queryFn: () => apiFetch<Stats>("/users/me/stats") });
  const badgesQuery = useQuery({ queryKey: ["student-badges"], queryFn: () => apiFetch<UserBadge[]>("/users/me/badges") });
  const leaderboardQuery = useQuery({ queryKey: ["leaderboard"], queryFn: () => apiFetch<Leaderboard>("/leaderboard") });

  const stats = statsQuery.data;
  const badges = badgesQuery.data ?? [];
  const rows = leaderboardQuery.data?.items ?? [];

  const cards = [
    { label: "XP Points", value: stats?.totalXp ?? 0, icon: Sparkles },
    { label: "Current Streak", value: `${stats?.currentStreak ?? 0} days`, icon: Flame },
    { label: "Longest Streak", value: `${stats?.longestStreak ?? 0} days`, icon: Trophy },
    { label: "Badges", value: stats?.badgeCount ?? 0, icon: Award },
    { label: "Enrolled", value: stats?.enrollmentCount ?? 0, icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 md:space-y-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">XP, streaks, badges, and the weekly leaderboard.</p>
      </div>

      <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-[var(--shadow-card)]">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
              {stats?.level ?? 1}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Level {stats?.level ?? 1}
              </p>
              <p className="text-xl font-semibold">{stats?.levelName ?? "Beginner"}</p>
            </div>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to next level</span>
              <span>
                {stats?.xpIntoLevel ?? 0} / {stats?.xpForNextLevel ?? 500} XP
              </span>
            </div>
            <Progress
              value={stats ? (stats.xpIntoLevel / stats.xpForNextLevel) * 100 : 0}
              className="mt-1.5 h-2"
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {statsQuery.isLoading ? "…" : c.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Achievements you&apos;ve unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            {badgesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : badges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No badges yet — complete lessons and stay on a streak to earn them.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                      {b.badge.icon ?? "🏅"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.badge.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Weekly leaderboard</CardTitle>
            <CardDescription>Top learners by XP this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboardQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No XP earned yet this week.
              </div>
            ) : (
              rows.map((r) => {
                const isMe = r.user.id === auth?.user.id;
                return (
                  <div
                    key={r.user.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      isMe ? "border-primary/40 bg-primary/5" : "border-border/60"
                    }`}
                  >
                    <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                      {r.rank}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={r.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(r.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {r.user.fullName} {isMe ? <Badge variant="secondary" className="ml-1">You</Badge> : null}
                    </span>
                    <span className="text-sm font-semibold text-primary">{r.xp} XP</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
