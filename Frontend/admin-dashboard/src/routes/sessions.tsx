import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/sessions")({
  component: AdminSessionsPage,
});

type UserSummary = { id: string; fullName: string; email: string };
type LiveSession = {
  id: string;
  title: string;
  instrument: string;
  startsAt: string;
  endsAt: string;
  price: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  rating: number | null;
  instructor: UserSummary;
  student: UserSummary | null;
};
type SessionsResponse = { items: LiveSession[]; total: number };

const FILTERS = ["ALL", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

const badgeVariant = (s: LiveSession["status"]) =>
  s === "ACTIVE" ? "default" : s === "CANCELLED" ? "destructive" : "outline";

const fmt = (v: string) =>
  new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function AdminSessionsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  const sessionsQuery = useQuery({
    queryKey: ["admin-sessions", filter],
    queryFn: () =>
      apiFetch<SessionsResponse>(
        `/admin/sessions${filter === "ALL" ? "" : `?status=${filter}`}`,
      ),
  });

  const sessions = sessionsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All live 1-on-1 sessions booked across the platform.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {sessionsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8" />
            No {filter === "ALL" ? "" : filter.toLowerCase()} sessions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{s.instrument}</Badge>
                    <Badge variant={badgeVariant(s.status)}>{s.status}</Badge>
                    {s.rating ? <Badge variant="outline">★ {s.rating}/5</Badge> : null}
                  </div>
                  <p className="font-semibold">{s.title}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {s.instructor.fullName}
                      {" → "}
                      {s.student?.fullName ?? "Open"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {fmt(s.startsAt)}
                    </span>
                    <span>{s.price.toFixed(0)} TND</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
