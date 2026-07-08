import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, MessageSquare, PlayCircle, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { DailyRoom } from "@/components/daily-room";

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
};

type SessionRoom = {
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
  roomUrl: string | null;
  joinWindowStartsAt: string;
  roomExpiresAt: string;
  rating: number | null;
  ratingNote: string | null;
  instructor: UserSummary;
  student: UserSummary | null;
};

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionRoomPage,
});

const canJoin = (session: SessionRoom) => {
  const now = Date.now();
  return (
    now >= new Date(session.joinWindowStartsAt).getTime() &&
    now <= new Date(session.roomExpiresAt).getTime() &&
    session.status !== "CANCELLED"
  );
};

function SessionRoomPage() {
  const { sessionId } = Route.useParams();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [rating, setRating] = useState("5");
  const [note, setNote] = useState("");

  const roomQuery = useQuery({
    queryKey: ["session-room", sessionId],
    queryFn: () => apiFetch<SessionRoom>(`/sessions/${sessionId}/room`),
  });

  const rateMutation = useMutation({
    mutationFn: () =>
      apiFetch<SessionRoom>(`/sessions/${sessionId}/rate`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(rating),
          note,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-room", sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["student-sessions"] });
    },
  });

  const copyToken = async () => {
    if (!roomQuery.data?.roomToken) {
      return;
    }
    await navigator.clipboard.writeText(roomQuery.data.roomToken);
  };

  const session = roomQuery.data;
  const joinable = session ? canJoin(session) : false;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6">
      <Button asChild variant="ghost" className="gap-2">
        <Link to="/sessions">
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </Link>
      </Button>

      {roomQuery.isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-background p-8 shadow-[var(--shadow-card)]">
          Loading room…
        </div>
      ) : roomQuery.error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
          This room could not be loaded. It may still be locked until the join window opens.
        </div>
      ) : session ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]">
          <Card className="border-border/60 shadow-[var(--shadow-card)] overflow-hidden">
            {joined && session.roomUrl ? (
              <DailyRoom
                roomUrl={session.roomUrl}
                roomToken={session.roomToken}
                onLeft={() => setJoined(false)}
              />
            ) : (
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-background to-background">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <Badge variant={session.status === "ACTIVE" ? "default" : "secondary"}>
                    {session.status}
                  </Badge>
                  <h1 className="text-3xl font-semibold tracking-tight">{session.title}</h1>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    {session.instrument} coaching with {session.instructor.fullName}. Your live
                    Daily room opens once the join window is active.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      disabled={!joinable || !session.roomUrl}
                      className="gap-2"
                      onClick={() => setJoined(true)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {joinable ? "Join live room" : "Join window locked"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={copyToken}>
                      <Copy className="h-4 w-4" />
                      Copy room token
                    </Button>
                  </div>
                  {!session.roomUrl ? (
                    <p className="text-xs text-muted-foreground">
                      The live room is still being provisioned. Refresh shortly.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  Starts {new Date(session.startsAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <span>Ends {new Date(session.endsAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                <span>{session.price.toFixed(0)} TND</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {session.notes ?? "No instructor notes were added to this session."}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="mt-1 font-medium">{session.instructor.fullName}</p>
                  <p className="text-xs text-muted-foreground">{session.instructor.email}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="mt-1 font-medium">{session.student?.fullName ?? "You"}</p>
                  <p className="text-xs text-muted-foreground">{session.student?.email ?? "Booked"}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Room token</p>
                  <p className="mt-1 truncate font-mono text-xs">
                    {session.roomToken ?? "Waiting for room token"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Session tools</CardTitle>
                <CardDescription>Notes and follow-up are kept close to the room.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Room timing
                  </p>
                  <p className="mt-2 text-sm">
                    Join opens 10 minutes before start and expires 15 minutes after the session.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quick chat
                  </p>
                  <div className="mt-3 flex items-start gap-3 text-sm">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-muted-foreground">
                      In a production deployment this area would host the live Daily chat stream.
                      For now we keep the lesson notes and session state synced end-to-end.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {session.status === "COMPLETED" ? (
              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle>Rate this session</CardTitle>
                  <CardDescription>Leave a rating and a short note for the instructor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      rows={4}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="What worked well and what should we improve next time?"
                    />
                  </div>
                  <Button className="w-full gap-2" onClick={() => rateMutation.mutate()}>
                    <Star className="h-4 w-4" />
                    Save rating
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
