import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, PlayCircle, Plus, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
};

type AvailabilitySlot = {
  id: string;
  title: string;
  instrument: string;
  notes: string | null;
  price: number;
  startsAt: string;
  durationMinutes: number;
  isBooked: boolean;
  instructor: UserSummary;
};

type LiveSession = {
  id: string;
  title: string;
  instrument: string;
  notes: string | null;
  price: number;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  roomToken: string | null;
  rating: number | null;
  ratingNote: string | null;
  instructor: UserSummary;
  student: UserSummary | null;
  availability: {
    id: string;
    isBooked: boolean;
  } | null;
};

export const Route = createFileRoute("/sessions")({
  component: SessionsPage,
});

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const canJoinSession = (session: LiveSession) => {
  const now = Date.now();
  const startsAt = new Date(session.startsAt).getTime() - 10 * 60 * 1000;
  const endsAt = new Date(session.endsAt).getTime() + 15 * 60 * 1000;
  return now >= startsAt && now <= endsAt && session.status !== "CANCELLED";
};

function SessionsPage() {
  const queryClient = useQueryClient();
  const [ratingDraft, setRatingDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const mySessionsQuery = useQuery({
    queryKey: ["student-sessions"],
    queryFn: () => apiFetch<LiveSession[]>("/users/me/sessions"),
  });

  const availabilityQuery = useQuery({
    queryKey: ["student-availability"],
    queryFn: () => apiFetch<AvailabilitySlot[]>("/sessions/availability"),
  });

  const bookMutation = useMutation({
    // Free slots book directly; paid slots go through Flouci checkout first.
    mutationFn: async (slot: AvailabilitySlot) => {
      if (slot.price > 0) {
        const { link } = await apiFetch<{ link: string }>(`/payments/session/${slot.id}`, {
          method: "POST",
        });
        window.location.href = link;
        return null;
      }
      return apiFetch<LiveSession>("/sessions/book", {
        method: "POST",
        body: JSON.stringify({ availabilityId: slot.id }),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["student-availability"] }),
        queryClient.invalidateQueries({ queryKey: ["student-notifications-badge"] }),
      ]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<LiveSession>(`/sessions/${sessionId}/cancel`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-sessions"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({
      sessionId,
      rating,
      note,
    }: {
      sessionId: string;
      rating: number;
      note?: string;
    }) =>
      apiFetch<LiveSession>(`/sessions/${sessionId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, note }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-sessions"] });
    },
  });

  const sessions = mySessionsQuery.data ?? [];
  const openSlots = availabilityQuery.data ?? [];

  const upcomingSessions = useMemo(
    () =>
      sessions.filter((session) => session.status === "SCHEDULED" || session.status === "ACTIVE"),
    [sessions],
  );
  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "COMPLETED"),
    [sessions],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Live sessions
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Book coaching, join rooms, and keep your momentum moving.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              View your booked sessions, reserve open instructor slots, and jump into the live
              room once the join window opens.
            </p>
          </div>

          <Card className="w-full max-w-md border-border/60 bg-background/80 backdrop-blur">
            <CardContent className="grid grid-cols-3 gap-3 p-5 text-sm">
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Booked</p>
                <p className="mt-1 text-2xl font-semibold">{upcomingSessions.length}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Open slots</p>
                <p className="mt-1 text-2xl font-semibold">{openSlots.length}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-semibold">{completedSessions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Your sessions</CardTitle>
            <CardDescription>Upcoming and completed live lessons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mySessionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your sessions…</p>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                You have no booked live sessions yet.
              </div>
            ) : (
              sessions.map((session) => {
                const joinable = canJoinSession(session);
                const isPast = session.status === "COMPLETED" || session.status === "CANCELLED";

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{session.instrument}</Badge>
                          <Badge
                            variant={
                              session.status === "ACTIVE"
                                ? "default"
                                : session.status === "CANCELLED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight">{session.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.instructor.fullName} • {formatDateTime(session.startsAt)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.notes ?? "No extra notes were added for this session."}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {session.durationMinutes} min
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {session.price.toFixed(0)} TND
                          </span>
                          {session.rating ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Rated {session.rating}/5
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {joinable ? (
                          <Button asChild variant="outline" className="gap-2">
                            <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
                              <PlayCircle className="h-4 w-4" />
                              Join room
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" className="gap-2" disabled>
                            <PlayCircle className="h-4 w-4" />
                            Join room
                          </Button>
                        )}
                        {!isPast ? (
                          <Button
                            variant="ghost"
                            onClick={() => cancelMutation.mutate(session.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {session.status === "COMPLETED" ? (
                      <div className="mt-4 rounded-2xl bg-muted/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                          <div className="grid gap-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Rating
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={ratingDraft[session.id] ?? session.rating ?? ""}
                              onChange={(event) =>
                                setRatingDraft((current) => ({
                                  ...current,
                                  [session.id]: event.target.value,
                                }))
                              }
                              className="h-10 w-28 rounded-md border border-input bg-background px-3 text-sm"
                              placeholder="5"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Session note
                            </label>
                            <Textarea
                              value={noteDraft[session.id] ?? session.ratingNote ?? ""}
                              onChange={(event) =>
                                setNoteDraft((current) => ({
                                  ...current,
                                  [session.id]: event.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Share what went well or what to improve next time"
                            />
                          </div>
                          <Button
                            className="md:self-end"
                            disabled={rateMutation.isPending}
                            onClick={() => {
                              const rating = Number(ratingDraft[session.id] ?? session.rating ?? 5);
                              rateMutation.mutate({
                                sessionId: session.id,
                                rating: Number.isFinite(rating) ? rating : 5,
                                note: noteDraft[session.id] ?? session.ratingNote ?? undefined,
                              });
                            }}
                          >
                            Save rating
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Open slots</CardTitle>
            <CardDescription>Reserve the next session that fits your calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availabilityQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading open slots…</p>
            ) : openSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No open availability is currently listed.
              </div>
            ) : (
              openSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="secondary">{slot.instrument}</Badge>
                      <h3 className="font-semibold tracking-tight">{slot.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {slot.instructor.fullName} • {formatDateTime(slot.startsAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {slot.notes ?? "Book this slot to open the live room with the instructor."}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.durationMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          {slot.price.toFixed(0)} TND
                        </span>
                      </div>
                    </div>
                    <Button
                      className="shrink-0"
                      onClick={() => bookMutation.mutate(slot)}
                      disabled={bookMutation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                      {slot.price > 0 ? `Book · ${slot.price.toFixed(0)} TND` : "Book"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-border/60" />

      <section className="rounded-3xl border border-border/60 bg-background p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Need a quick reminder?</h2>
            <p className="text-sm text-muted-foreground">
              Notifications will collect booking confirmations, replies, and session updates in
              one place.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/notifications">View notifications</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
