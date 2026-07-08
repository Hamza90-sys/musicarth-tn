import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { DailyRoom } from "@/components/instructor/DailyRoom";

type UserSummary = { id: string; fullName: string; email: string };
type SessionRoom = {
  id: string;
  title: string;
  instrument: string;
  notes: string | null;
  price: number;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  roomToken: string | null;
  roomUrl: string | null;
  joinWindowStartsAt: string;
  roomExpiresAt: string;
  instructor: UserSummary;
  student: UserSummary | null;
};

export const Route = createFileRoute("/sessions/$sessionId")({
  component: InstructorSessionRoomPage,
});

const canJoin = (s: SessionRoom) => {
  const now = Date.now();
  return (
    now >= new Date(s.joinWindowStartsAt).getTime() &&
    now <= new Date(s.roomExpiresAt).getTime() &&
    s.status !== "CANCELLED"
  );
};

function InstructorSessionRoomPage() {
  const { sessionId } = Route.useParams();
  const [joined, setJoined] = useState(false);

  const roomQuery = useQuery({
    queryKey: ["instructor-session-room", sessionId],
    queryFn: () => apiFetch<SessionRoom>(`/sessions/${sessionId}/room`),
  });

  const session = roomQuery.data;
  const joinable = session ? canJoin(session) : false;

  const copyToken = async () => {
    if (session?.roomToken) await navigator.clipboard.writeText(session.roomToken);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <Button asChild variant="ghost" className="gap-2">
        <Link to="/sessions">
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>
      </Button>

      {roomQuery.isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-background p-8 shadow-soft">
          Loading room…
        </div>
      ) : roomQuery.error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
          This room could not be loaded. It may still be locked until the join window opens
          (10 minutes before start).
        </div>
      ) : session ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]">
          <Card className="overflow-hidden border-border/60 shadow-soft">
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
                    {session.instrument} session with {session.student?.fullName ?? "your student"}.
                    The live room opens once the join window is active.
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
                      <Copy className="h-4 w-4" /> Copy room token
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
                  Starts{" "}
                  {new Date(session.startsAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span>
                  Ends{" "}
                  {new Date(session.endsAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span>{session.price.toFixed(0)} TND</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {session.notes ?? "No notes were added to this session."}
              </p>
            </CardContent>
          </Card>

          <Card className="h-fit border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Student</CardTitle>
              <CardDescription>Who you&apos;re meeting with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{session.student?.fullName ?? "Open slot"}</p>
              <p className="text-sm text-muted-foreground">{session.student?.email ?? "—"}</p>
              <div className="mt-4 rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
                Join opens 10 minutes before start and expires 15 minutes after the session ends.
                Screen share and chat are available inside the room.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
