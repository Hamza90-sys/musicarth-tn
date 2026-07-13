import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Clock, Users, Video, Check, Ticket } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { useStoredAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/sessions")({
  component: InstructorSessionsPage,
});

type SessionType = "ONE_ON_ONE" | "GROUP";

type EligibleStudent = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

type LiveSession = {
  id: string;
  title: string;
  instrument: string;
  startsAt: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  sessionType: SessionType;
  price: number;
  student: { fullName: string } | null;
  participants: { user: { id: string; fullName: string } }[];
};

type OpenSlot = {
  id: string;
  title: string;
  instrument: string;
  price: number;
  startsAt: string;
  durationMinutes: number;
  sessionType: SessionType;
  capacity: number;
  seatsTaken: number;
  isBooked: boolean;
};

type Mode = "assign" | "open";
const MAX_SEATS = 12;

const instruments = ["piano", "guitar", "violin", "drums", "voice", "oud", "theory"];
const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const fmt = (v: string) =>
  new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const initials = (n?: string) =>
  (n ?? "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

const MAX_GROUP = 5;

function InstructorSessionsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const auth = useStoredAuth();

  const [mode, setMode] = useState<Mode>("assign");
  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState("piano");
  const [sessionType, setSessionType] = useState<SessionType>("ONE_ON_ONE");
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [price, setPrice] = useState("40");
  const [seats, setSeats] = useState("4");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["session-eligible-students"],
    queryFn: () => apiFetch<EligibleStudent[]>("/sessions/eligible-students"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["instructor-sessions"],
    queryFn: () => apiFetch<LiveSession[]>("/users/me/sessions"),
  });
  const slotsQuery = useQuery({
    queryKey: ["instructor-open-slots", auth?.user.id],
    queryFn: () => apiFetch<OpenSlot[]>(`/instructors/${auth!.user.id}/availability`),
    enabled: Boolean(auth?.user.id),
  });

  const students = studentsQuery.data ?? [];
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return q
      ? students.filter((s) => `${s.fullName} ${s.email}`.toLowerCase().includes(q))
      : students;
  }, [students, studentSearch]);

  const setType = (t: SessionType) => {
    setSessionType(t);
    if (t === "ONE_ON_ONE") setSelected((prev) => prev.slice(0, 1));
  };

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      if (sessionType === "ONE_ON_ONE") return prev[0] === id ? [] : [id];
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_GROUP) {
        toast.error(`A group session can have up to ${MAX_GROUP} students`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const createSession = useMutation({
    mutationFn: () =>
      apiFetch("/sessions/assigned", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          instrument,
          sessionType,
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          studentIds: selected,
          notes: notes.trim() || undefined,
        }),
      }),
    onSuccess: async () => {
      toast.success("Session scheduled — students were notified");
      setTitle("");
      setNotes("");
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ["instructor-sessions"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not schedule session"),
  });

  // Open paid slot: students browse it and pay per seat (group = many seats).
  const createSlot = useMutation({
    mutationFn: () =>
      apiFetch("/sessions/availability", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          instrument,
          sessionType,
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          capacity: sessionType === "GROUP" ? Number(seats) : undefined,
          notes: notes.trim() || undefined,
        }),
      }),
    onSuccess: async () => {
      toast.success("Open slot published — students can book and pay");
      setTitle("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["instructor-open-slots"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not publish slot"),
  });

  const cancelSession = useMutation({
    mutationFn: (id: string) => apiFetch(`/sessions/${id}/cancel`, { method: "POST" }),
    onSuccess: async () => {
      toast.success("Session cancelled");
      await queryClient.invalidateQueries({ queryKey: ["instructor-sessions"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not cancel"),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!startsAt) return toast.error("Pick a date and time");
    if (mode === "open") {
      if (Number(price) <= 0) return toast.error("Set a price for a paid slot");
      if (sessionType === "GROUP" && (Number(seats) < 2 || Number(seats) > MAX_SEATS))
        return toast.error(`A group slot needs 2–${MAX_SEATS} seats`);
      return createSlot.mutate();
    }
    if (sessionType === "ONE_ON_ONE" && selected.length !== 1)
      return toast.error("Pick exactly one student for a 1:1 session");
    if (sessionType === "GROUP" && (selected.length < 1 || selected.length > MAX_GROUP))
      return toast.error(`Pick 1–${MAX_GROUP} students for a group session`);
    createSession.mutate();
  };

  const submitting = createSession.isPending || createSlot.isPending;

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("sessionsTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("sessionsSub")}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarPlus className="h-5 w-5" /> Schedule a session
            </CardTitle>
            <CardDescription>
              {mode === "assign"
                ? "Assign a session to students enrolled in your courses — no payment."
                : "Publish a paid slot students book themselves. Musicarth keeps 20%; you keep the rest, per seat."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Mode: assign to my students vs open a paid slot */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "assign", label: "Assign to students", hint: "Free · you pick who" },
                  { id: "open", label: "Open a paid slot", hint: "Students book & pay" },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      mode === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.hint}</p>
                  </button>
                ))}
              </div>

              {/* Session type */}
              <div className="space-y-1.5">
                <Label>Session type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "ONE_ON_ONE", label: "1:1", hint: "One student" },
                    {
                      id: "GROUP",
                      label: "Group",
                      hint: mode === "open" ? `Up to ${MAX_SEATS} seats` : `Up to ${MAX_GROUP}`,
                    },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setType(opt.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        sessionType === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Piano coaching" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Instrument</Label>
                  <select className={`${selectClass} capitalize`} value={instrument} onChange={(e) => setInstrument(e.target.value)}>
                    {instruments.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <select className={selectClass} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startsAt">Date &amp; time</Label>
                  <Input id="startsAt" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (TND){mode === "open" ? " / seat" : ""}</Label>
                  <Input id="price" type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>

              {/* Seats — only for a paid group slot */}
              {mode === "open" && sessionType === "GROUP" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="seats">Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="2"
                    max={MAX_SEATS}
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each student pays {price || 0} TND for a seat; Musicarth keeps 20% of every seat.
                  </p>
                </div>
              ) : null}

              {/* Student picker — only when assigning to your own students */}
              {mode === "assign" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>
                    {sessionType === "ONE_ON_ONE" ? "Student" : `Students (${selected.length}/${MAX_GROUP})`}
                  </Label>
                  {students.length > 6 ? (
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search…"
                      className="h-7 w-32 text-xs"
                    />
                  ) : null}
                </div>
                <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-border/60 p-2">
                  {studentsQuery.isLoading ? (
                    <p className="p-2 text-sm text-muted-foreground">Loading students…</p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                      {students.length === 0
                        ? "No students enrolled in your courses yet."
                        : "No students match your search."}
                    </p>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSel = selected.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStudent(s.id)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                            isSel ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials(s.fullName)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{s.fullName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                          </span>
                          {isSel ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What the student should prepare" />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? mode === "open"
                    ? "Publishing…"
                    : "Scheduling…"
                  : mode === "open"
                    ? "Publish paid slot"
                    : "Schedule session"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Your sessions</CardTitle>
            <CardDescription>Upcoming and past sessions you scheduled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
                No sessions yet. Schedule one on the left.
              </div>
            ) : (
              sessions.map((s) => {
                const names =
                  s.participants?.length > 0
                    ? s.participants.map((p) => p.user.fullName)
                    : s.student
                      ? [s.student.fullName]
                      : [];
                return (
                  <div key={s.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{s.title}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary">{s.sessionType === "GROUP" ? "Group" : "1:1"}</Badge>
                        <Badge
                          variant={
                            s.status === "ACTIVE" ? "default" : s.status === "CANCELLED" ? "destructive" : "outline"
                          }
                        >
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {names.length > 0 ? names.join(", ") : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {fmt(s.startsAt)}
                      </span>
                      <span>{s.price.toFixed(0)} TND</span>
                    </div>
                    {s.status === "SCHEDULED" || s.status === "ACTIVE" ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5">
                          <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                            <Video className="h-3.5 w-3.5" /> Join room
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive"
                          onClick={() => cancelSession.mutate(s.id)}
                          disabled={cancelSession.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5" /> Your open paid slots
            </CardTitle>
            <CardDescription>Slots students can book and pay for themselves. Group slots fill seat by seat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {slotsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (slotsQuery.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
                No open slots yet. Publish one with “Open a paid slot”.
              </div>
            ) : (
              (slotsQuery.data ?? []).map((slot) => {
                const seatsLeft = Math.max(0, slot.capacity - slot.seatsTaken);
                return (
                  <div key={slot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{slot.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {fmt(slot.startsAt)}
                        </span>
                        <span className="capitalize">{slot.instrument}</span>
                        <span>{slot.price.toFixed(0)} TND{slot.sessionType === "GROUP" ? " / seat" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{slot.sessionType === "GROUP" ? "Group" : "1:1"}</Badge>
                      {slot.sessionType === "GROUP" ? (
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" /> {slot.seatsTaken}/{slot.capacity} booked
                        </Badge>
                      ) : null}
                      <Badge variant={seatsLeft === 0 ? "default" : "outline"}>
                        {seatsLeft === 0 ? "Full" : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
                      </Badge>
                    </div>
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
