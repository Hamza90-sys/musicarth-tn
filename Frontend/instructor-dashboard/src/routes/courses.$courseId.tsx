import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as UpChunk from "@mux/upchunk";
import { ArrowLeft, Plus, UploadCloud, Video, CheckCircle2, Image as ImageIcon, Eye, EyeOff, Save, RefreshCw, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/image";

const instruments = ["piano", "guitar", "violin", "drums", "voice", "oud", "theory"];
const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const Route = createFileRoute("/courses/$courseId")({
  component: ManageCoursePage,
});

type Lesson = {
  id: string;
  title: string;
  order: number;
  isFreePreview: boolean;
  videoStatus?: "NONE" | "PENDING" | "PROCESSING" | "READY" | "ERRORED" | null;
};
type Section = { id: string; title: string; order: number; lessons: Lesson[] };
type Course = {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  instrument: string;
  level: string;
  price: number | null;
  includedLiveSessions?: number;
  isPublished: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  thumbnailUrl?: string | null;
  whatYouWillLearn?: string[];
  requirements?: string[];
  tags?: string[];
  sections: Section[];
};

const statusBadge = (s?: Lesson["videoStatus"]) => {
  if (s === "READY") return { label: "Ready", variant: "default" as const };
  if (s === "PROCESSING" || s === "PENDING") return { label: "Processing", variant: "secondary" as const };
  if (s === "ERRORED") return { label: "Failed", variant: "destructive" as const };
  return { label: "No video", variant: "outline" as const };
};

function LessonVideoUpload({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const start = async (file: File) => {
    setProgress(0);
    try {
      const ticket = await apiFetch<{ uploadUrl: string }>(`/lessons/${lessonId}/upload-url`, {
        method: "POST",
      });
      const upload = UpChunk.createUpload({ endpoint: ticket.uploadUrl, file });
      upload.on("progress", (e) => setProgress(Math.min(100, (e.detail as number) ?? 0)));
      upload.on("error", () => {
        setProgress(null);
        toast.error("Upload failed");
      });
      upload.on("success", () => {
        setProgress(null);
        toast.success("Uploaded — Mux is transcoding");
        onDone();
      });
    } catch (err) {
      setProgress(null);
      toast.error(err instanceof ApiError ? err.message : "Could not start upload");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => ref.current?.click()}
        disabled={progress !== null}
      >
        <UploadCloud className="h-3.5 w-3.5" />
        {progress !== null ? `Uploading ${Math.round(progress)}%` : "Upload video"}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f);
        }}
      />
    </>
  );
}

function ManageCoursePage() {
  const { courseId } = useParams({ from: "/courses/$courseId" });
  const queryClient = useQueryClient();
  const thumbRef = useRef<HTMLInputElement>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState<Record<string, string>>({});
  const [lessonTitleFr, setLessonTitleFr] = useState<Record<string, string>>({});
  const [lessonTitleAr, setLessonTitleAr] = useState<Record<string, string>>({});
  const [details, setDetails] = useState({
    title: "",
    subtitle: "",
    description: "",
    instrument: "piano",
    level: "beginner",
    price: "0",
    includedLiveSessions: "0",
    whatYouWillLearn: "",
    requirements: "",
    tags: "",
  });

  const courseQuery = useQuery({
    queryKey: ["instructor-course", courseId],
    queryFn: () => apiFetch<Course>(`/courses/${courseId}`),
  });
  const course = courseQuery.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["instructor-course", courseId] });

  // Load the course's current details into the editable form once it arrives.
  useEffect(() => {
    if (!course) return;
    setDetails({
      title: course.title,
      subtitle: course.subtitle ?? "",
      description: course.description,
      instrument: course.instrument,
      level: course.level,
      price: course.price != null ? String(course.price) : "0",
      includedLiveSessions: String(course.includedLiveSessions ?? 0),
      whatYouWillLearn: (course.whatYouWillLearn ?? []).join("\n"),
      requirements: (course.requirements ?? []).join("\n"),
      tags: (course.tags ?? []).join(", "),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  const saveDetails = useMutation({
    mutationFn: () => {
      const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
      const toList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
      return apiFetch(`/courses/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: details.title.trim(),
          subtitle: details.subtitle.trim(),
          description: details.description.trim(),
          instrument: details.instrument,
          level: details.level,
          price: Number(details.price) || 0,
          includedLiveSessions: Number(details.includedLiveSessions) || 0,
          whatYouWillLearn: toLines(details.whatYouWillLearn),
          requirements: toLines(details.requirements),
          tags: toList(details.tags),
        }),
      });
    },
    onSuccess: async () => {
      toast.success("Course details saved");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not save details"),
  });

  const setField = (k: keyof typeof details, v: string) => setDetails((d) => ({ ...d, [k]: v }));

  // Poll Mux for a lesson's transcoding status (webhooks don't reach localhost).
  const syncLesson = useMutation({
    mutationFn: (lessonId: string) => apiFetch(`/lessons/${lessonId}/sync`, { method: "POST" }),
    onSuccess: async () => {
      await refresh();
    },
  });

  type Coupon = {
    id: string;
    code: string;
    percentOff: number;
    courseId: string | null;
    maxUses: number | null;
    uses: number;
    active: boolean;
    expiresAt: string | null;
  };
  const [couponForm, setCouponForm] = useState({ code: "", percentOff: "20", maxUses: "" });
  const couponsQuery = useQuery({
    queryKey: ["my-coupons"],
    queryFn: () => apiFetch<Coupon[]>("/payments/coupons/mine"),
  });
  const courseCoupons = (couponsQuery.data ?? []).filter(
    (c) => c.courseId === courseId || c.courseId === null,
  );
  const createCoupon = useMutation({
    mutationFn: () =>
      apiFetch("/payments/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: couponForm.code.trim(),
          percentOff: Number(couponForm.percentOff),
          courseId,
          ...(couponForm.maxUses ? { maxUses: Number(couponForm.maxUses) } : {}),
        }),
      }),
    onSuccess: async () => {
      toast.success("Coupon created");
      setCouponForm({ code: "", percentOff: "20", maxUses: "" });
      await queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not create coupon"),
  });
  const deactivateCoupon = useMutation({
    mutationFn: (id: string) => apiFetch("/payments/coupons/" + id, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
    },
  });

  // When the page loads, auto-check any lessons still processing so they flip to
  // READY without the instructor doing anything.
  const autoSyncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!course || autoSyncedRef.current === course.id) return;
    autoSyncedRef.current = course.id;
    course.sections
      .flatMap((s) => s.lessons)
      .filter((l) => l.videoStatus === "PENDING" || l.videoStatus === "PROCESSING")
      .forEach((l) => syncLesson.mutate(l.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  const addSection = useMutation({
    mutationFn: () =>
      apiFetch(`/courses/${courseId}/sections`, {
        method: "POST",
        body: JSON.stringify({ title: sectionTitle.trim(), order: (course?.sections.length ?? 0) + 1 }),
      }),
    onSuccess: async () => {
      setSectionTitle("");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not add section"),
  });

  const addLesson = useMutation({
    mutationFn: ({ sectionId, order }: { sectionId: string; order: number }) =>
      apiFetch(`/courses/sections/${sectionId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title: (lessonTitle[sectionId] ?? "").trim(),
          titleFr: (lessonTitleFr[sectionId] ?? "").trim() || undefined,
          titleAr: (lessonTitleAr[sectionId] ?? "").trim() || undefined,
          order,
        }),
      }),
    onSuccess: async (_d, vars) => {
      setLessonTitle((prev) => ({ ...prev, [vars.sectionId]: "" }));
      setLessonTitleFr((prev) => ({ ...prev, [vars.sectionId]: "" }));
      setLessonTitleAr((prev) => ({ ...prev, [vars.sectionId]: "" }));
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not add lesson"),
  });

  const thumbnailMutation = useMutation({
    mutationFn: (thumbnailUrl: string) =>
      apiFetch(`/courses/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify({ thumbnailUrl }),
      }),
    onSuccess: async () => {
      toast.success("Course image updated");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not update image"),
  });

  const onPickThumbnail = async (file: File | null) => {
    if (!file) return;
    try {
      thumbnailMutation.mutate(await uploadImage(file, "courses", 1280, 0.82));
    } catch {
      toast.error("Could not process that image. Try a different file.");
    }
  };

  const togglePreview = useMutation({
    mutationFn: (lesson: Lesson) =>
      apiFetch(`/courses/lessons/${lesson.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFreePreview: !lesson.isFreePreview }),
      }),
    onSuccess: async () => {
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not update lesson"),
  });

  const publish = useMutation({
    mutationFn: () => apiFetch(`/courses/${courseId}/publish`, { method: "POST" }),
    onSuccess: async () => {
      toast.success("Publish request sent");
      await refresh();
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not publish (needs admin approval)"),
  });

  const navigate = useNavigate();
  const deleteCourse = useMutation({
    mutationFn: () => apiFetch(`/courses/${courseId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Course deleted");
      await queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      navigate({ to: "/courses" });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete course"),
  });
  const deleteSection = useMutation({
    mutationFn: (sectionId: string) => apiFetch(`/courses/sections/${sectionId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Section deleted");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete section"),
  });
  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => apiFetch(`/courses/lessons/${lessonId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Lesson deleted");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete lesson"),
  });
  const reorderSections = useMutation({
    mutationFn: (sectionIds: string[]) =>
      apiFetch(`/courses/${courseId}/sections/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ sectionIds }),
      }),
    onSuccess: () => refresh(),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not reorder"),
  });
  const reorderLessons = useMutation({
    mutationFn: ({ sectionId, lessonIds }: { sectionId: string; lessonIds: string[] }) =>
      apiFetch(`/courses/sections/${sectionId}/lessons/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ lessonIds }),
      }),
    onSuccess: () => refresh(),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not reorder"),
  });

  // Move an item within an array and return the new id order.
  const moved = <T extends { id: string }>(arr: T[], index: number, dir: -1 | 1) => {
    const next = [...arr];
    const target = index + dir;
    if (target < 0 || target >= next.length) return null;
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((x) => x.id);
  };

  if (courseQuery.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading course…</div>;
  }
  if (!course) {
    return <div className="p-8 text-sm text-destructive">Course not found.</div>;
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <Button asChild variant="ghost" className="gap-2 px-2 text-muted-foreground">
        <Link to="/courses">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            <Badge variant={course.isPublished ? "default" : "outline"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{course.instrument}</Badge>
            <Badge variant="outline">{course.level}</Badge>
            {course.approvalStatus ? (
              <Badge variant="secondary">Approval: {course.approvalStatus}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!course.isPublished ? (
            <Button onClick={() => publish.mutate()} disabled={publish.isPending} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {publish.isPending ? "Submitting…" : "Submit for publishing"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={deleteCourse.isPending}
            onClick={() => {
              if (confirm(`Delete "${course.title}"? This removes all its sections, lessons, and enrolments. This cannot be undone.`)) {
                deleteCourse.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete course
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Course details</CardTitle>
          <CardDescription>These show on the course page. Save when you’re done.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-title">Title</Label>
            <Input id="d-title" value={details.title} onChange={(e) => setField("title", e.target.value)} placeholder="Course title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-subtitle">Subtitle</Label>
            <Input id="d-subtitle" value={details.subtitle} onChange={(e) => setField("subtitle", e.target.value)} placeholder="One line shown under the title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-desc">Description</Label>
            <Textarea id="d-desc" rows={4} value={details.description} onChange={(e) => setField("description", e.target.value)} placeholder="What students will learn…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Instrument</Label>
              <select className={selectClass} value={details.instrument} onChange={(e) => setField("instrument", e.target.value)}>
                {instruments.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <select className={selectClass} value={details.level} onChange={(e) => setField("level", e.target.value)}>
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-price">Price (TND)</Label>
              <Input id="d-price" type="number" min="0" value={details.price} onChange={(e) => setField("price", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-sessions">Included live sessions</Label>
              <Input id="d-sessions" type="number" min="0" max="50" value={details.includedLiveSessions} onChange={(e) => setField("includedLiveSessions", e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Live 1:1/group sessions you’ll give students who buy this course (0 = none). Standalone paid sessions are separate.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="d-wyl">What you’ll learn <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea id="d-wyl" rows={4} value={details.whatYouWillLearn} onChange={(e) => setField("whatYouWillLearn", e.target.value)} placeholder={"Play your first song\nMaster basic chords"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-req">Requirements <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea id="d-req" rows={4} value={details.requirements} onChange={(e) => setField("requirements", e.target.value)} placeholder={"A guitar\nNo experience needed"} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-tags">Tags <span className="text-muted-foreground">(comma separated)</span></Label>
            <Input id="d-tags" value={details.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="Chords, Strumming, Beginner" />
          </div>
          <Button onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {saveDetails.isPending ? "Saving…" : "Save details"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Course image</CardTitle>
          <CardDescription>
            Shown on the catalogue and the course page. A wide (16:9) image works best.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative aspect-video w-full max-w-xs shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={thumbnailMutation.isPending}
              onClick={() => thumbRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" />
              {thumbnailMutation.isPending
                ? "Uploading…"
                : course.thumbnailUrl
                  ? "Change image"
                  : "Upload image"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG or PNG. We resize it automatically.</p>
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickThumbnail(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Coupons</CardTitle>
          <CardDescription>
            Discount codes for this course. Students enter the code at checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="cc-code" className="text-xs">Code</Label>
              <Input
                id="cc-code"
                value={couponForm.code}
                onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="LAUNCH20"
                className="h-9 w-36 uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cc-pct" className="text-xs">% off</Label>
              <Input
                id="cc-pct"
                type="number"
                min="1"
                max="100"
                value={couponForm.percentOff}
                onChange={(e) => setCouponForm((f) => ({ ...f, percentOff: e.target.value }))}
                className="h-9 w-20"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cc-max" className="text-xs">Max uses (optional)</Label>
              <Input
                id="cc-max"
                type="number"
                min="1"
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm((f) => ({ ...f, maxUses: e.target.value }))}
                className="h-9 w-28"
              />
            </div>
            <Button
              size="sm"
              className="h-9"
              disabled={!couponForm.code.trim() || createCoupon.isPending}
              onClick={() => createCoupon.mutate()}
            >
              {createCoupon.isPending ? "Creating…" : "Create coupon"}
            </Button>
          </div>
          {courseCoupons.length > 0 ? (
            <div className="space-y-1.5">
              {courseCoupons.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.percentOff}% off · used {c.uses}{c.maxUses ? "/" + c.maxUses : ""}
                    {c.active ? "" : " · inactive"}
                  </span>
                  {c.active ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive"
                      onClick={() => deactivateCoupon.mutate(c.id)}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {course.sections.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No sections yet. Add your first section below.
            </CardContent>
          </Card>
        ) : (
          course.sections.map((section, si) => (
            <Card key={section.id} className="border-border/60 shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {si + 1}. {section.title}
                    </CardTitle>
                    <CardDescription>{section.lessons.length} lessons</CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={si === 0 || reorderSections.isPending}
                      onClick={() => {
                        const ids = moved(course.sections, si, -1);
                        if (ids) reorderSections.mutate(ids);
                      }}
                      title="Move section up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={si === course.sections.length - 1 || reorderSections.isPending}
                      onClick={() => {
                        const ids = moved(course.sections, si, 1);
                        if (ids) reorderSections.mutate(ids);
                      }}
                      title="Move section down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete section "${section.title}" and all its lessons?`)) {
                          deleteSection.mutate(section.id);
                        }
                      }}
                      title="Delete section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.lessons.map((lesson, li) => {
                  const sb = statusBadge(lesson.videoStatus);
                  return (
                    <div
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {si + 1}.{li + 1} {lesson.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={lesson.isFreePreview ? "default" : "outline"}
                          className="gap-1.5"
                          disabled={togglePreview.isPending}
                          onClick={() => togglePreview.mutate(lesson)}
                          title="Free-preview lessons can be watched by anyone before enrolling"
                        >
                          {lesson.isFreePreview ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {lesson.isFreePreview ? "Free preview" : "Locked"}
                        </Button>
                        <Badge variant={sb.variant}>{sb.label}</Badge>
                        {lesson.videoStatus === "PENDING" || lesson.videoStatus === "PROCESSING" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => syncLesson.mutate(lesson.id)}
                            disabled={syncLesson.isPending}
                            title="Check transcoding status"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncLesson.isPending ? "animate-spin" : ""}`} />
                            Check
                          </Button>
                        ) : null}
                        <LessonVideoUpload lessonId={lesson.id} onDone={refresh} />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={li === 0 || reorderLessons.isPending}
                          onClick={() => {
                            const ids = moved(section.lessons, li, -1);
                            if (ids) reorderLessons.mutate({ sectionId: section.id, lessonIds: ids });
                          }}
                          title="Move lesson up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={li === section.lessons.length - 1 || reorderLessons.isPending}
                          onClick={() => {
                            const ids = moved(section.lessons, li, 1);
                            if (ids) reorderLessons.mutate({ sectionId: section.id, lessonIds: ids });
                          }}
                          title="Move lesson down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete lesson "${lesson.title}"?`)) {
                              deleteLesson.mutate(lesson.id);
                            }
                          }}
                          title="Delete lesson"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New lesson title"
                      value={lessonTitle[section.id] ?? ""}
                      onChange={(e) =>
                        setLessonTitle((prev) => ({ ...prev, [section.id]: e.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={!(lessonTitle[section.id] ?? "").trim() || addLesson.isPending}
                      onClick={() =>
                        addLesson.mutate({
                          sectionId: section.id,
                          order: section.lessons.length + 1,
                        })
                      }
                    >
                      <Plus className="h-4 w-4" /> Lesson
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Titre (Français) — optionnel"
                      value={lessonTitleFr[section.id] ?? ""}
                      onChange={(e) =>
                        setLessonTitleFr((prev) => ({ ...prev, [section.id]: e.target.value }))
                      }
                    />
                    <Input
                      dir="rtl"
                      placeholder="العنوان (العربية) — اختياري"
                      value={lessonTitleAr[section.id] ?? ""}
                      onChange={(e) =>
                        setLessonTitleAr((prev) => ({ ...prev, [section.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex gap-2 p-4">
            <Input
              placeholder="New section title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
            <Button
              className="shrink-0 gap-1.5"
              disabled={!sectionTitle.trim() || addSection.isPending}
              onClick={() => addSection.mutate()}
            >
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
