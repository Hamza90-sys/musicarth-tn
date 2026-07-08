import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Star,
  Users,
  Globe,
  Clock,
  Play,
  ChevronDown,
  PlayCircle,
  FileText,
  Lock,
  Check,
  Award,
  Download,
  Infinity as InfinityIcon,
  Smartphone,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { DASHBOARD_URLS } from "@/lib/dashboard-links";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/courses/$courseId")({
  // Server-side fetch purely for SEO meta tags; the page itself still loads
  // via react-query on the client. Failure is non-fatal (generic meta).
  loader: async ({ params }) => {
    try {
      return await api<Course>(`/courses/${params.courseId}`);
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const c = loaderData as Course | null;
    const title = c ? `${c.title} — Musicarth` : "Course — Musicarth";
    const description =
      c?.subtitle ?? c?.description?.slice(0, 160) ?? "Learn music on Musicarth.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(c?.thumbnailUrl && !c.thumbnailUrl.startsWith("data:")
          ? [{ property: "og:image", content: c.thumbnailUrl }]
          : []),
      ],
    };
  },
  component: CourseSalesPage,
});

type Lesson = {
  id: string;
  title: string;
  content?: string | null;
  durationSeconds?: number | null;
  isFreePreview?: boolean;
  videoStatus?: "NONE" | "PENDING" | "PROCESSING" | "READY" | "ERRORED" | null;
  muxPlaybackId?: string | null;
  order: number;
};
type Section = { id: string; title: string; order: number; lessons: Lesson[] };
type Instructor = {
  id: string;
  fullName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};
type Course = {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  instrument: string;
  level: string;
  price: number | null;
  thumbnailUrl?: string | null;
  whatYouWillLearn?: string[];
  requirements?: string[];
  tags?: string[];
  enrolledCount?: number;
  totalLessons?: number;
  totalDurationSeconds?: number;
  instructor: Instructor | null;
  sections: Section[];
};
type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl: string | null };
};
type ReviewsResponse = { items: Review[]; average: number | null; count: number };

const api = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
};

const fmtTotal = (seconds?: number) => {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtLesson = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
const hasVideo = (l: Lesson) => l.videoStatus === "READY" && Boolean(l.muxPlaybackId);
const initials = (n?: string) =>
  (n ?? "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${
            i < value ? "fill-warning text-warning" : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function CourseSalesPage() {
  const { t } = useI18n();
  const { courseId } = Route.useParams();

  const courseQuery = useQuery({
    queryKey: ["public-course", courseId],
    queryFn: () => api<Course>(`/courses/${courseId}`),
  });
  const reviewsQuery = useQuery({
    queryKey: ["public-course-reviews", courseId],
    queryFn: () => api<ReviewsResponse>(`/courses/${courseId}/reviews`),
  });

  const course = courseQuery.data;
  const reviews = reviewsQuery.data;

  const previewLesson = useMemo(
    () =>
      course?.sections
        .flatMap((s) => s.lessons)
        .find((l) => l.isFreePreview && hasVideo(l)) ?? null,
    [course?.sections],
  );

  const enrollUrl = `${DASHBOARD_URLS.student}/courses/${courseId}`;
  const isFree = course?.price == null || course.price === 0;

  if (courseQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-[1240px] px-6 py-24 text-muted-foreground">Loading course…</div>
      </div>
    );
  }
  if (courseQuery.error || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-[1240px] px-6 py-24">
          <h1 className="text-2xl font-bold">Course not available</h1>
          <p className="mt-2 text-muted-foreground">This course may have been removed or unpublished.</p>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">← Back home</Link>
        </div>
      </div>
    );
  }

  const totalDuration = fmtTotal(course.totalDurationSeconds);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-primary-glow/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Courses</Link>
            <span>/</span>
            <span className="capitalize">{course.instrument}</span>
            <span>/</span>
            <span className="text-foreground capitalize">{course.level}</span>
          </nav>
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-medium capitalize text-primary">
              {course.instrument}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">{course.title}</h1>
            {course.subtitle ? (
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{course.subtitle}</p>
            ) : (
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed line-clamp-2">
                {course.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm">
              {reviews?.average != null ? (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold">{reviews.average.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.count.toLocaleString()} {t("reviews")})</span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{(course.enrolledCount ?? 0).toLocaleString()} {t("students")}</span>
              </div>
              {totalDuration ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{totalDuration}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-14 min-w-0">
            <VideoPreview course={course} previewLesson={previewLesson} />

            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">{t("aboutCourse")}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
              {course.tags && course.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {course.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <Curriculum course={course} totalDuration={totalDuration} />

            {course.requirements && course.requirements.length > 0 ? (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mb-4">{t("requirements")}</h2>
                <ul className="space-y-2 text-muted-foreground">
                  {course.requirements.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Instructor instructor={course.instructor} />
            <Reviews reviews={reviews} />
          </div>

          <EnrollCard course={course} isFree={isFree} enrollUrl={enrollUrl} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function VideoPreview({ course, previewLesson }: { course: Course; previewLesson: Lesson | null }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const play = async () => {
    if (!previewLesson) return;
    setLoading(true);
    try {
      const data = await api<{ playbackId: string; token: string }>(
        `/lessons/${previewLesson.id}/preview-playback`,
      );
      setEmbedUrl(`https://player.mux.com/${data.playbackId}?autoplay=true&token=${data.token}`);
    } catch {
      setEmbedUrl(null);
    } finally {
      setLoading(false);
    }
  };

  if (embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-elegant">
        <iframe
          src={embedUrl}
          title="Course preview"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-foreground shadow-elegant">
      {course.thumbnailUrl ? (
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/40 to-primary-glow/30" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      {previewLesson ? (
        <button
          onClick={play}
          aria-label="Play preview"
          disabled={loading}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-background/95 shadow-elegant transition-transform duration-300 group-hover:scale-110">
            <Play className="h-7 w-7 fill-primary text-primary translate-x-0.5" />
          </span>
        </button>
      ) : null}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-background">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            {previewLesson ? "Preview" : "Trailer coming soon"}
          </p>
          {previewLesson ? <p className="text-base font-semibold">{previewLesson.title}</p> : null}
        </div>
        {previewLesson && fmtLesson(previewLesson.durationSeconds) ? (
          <span className="rounded-md bg-background/15 px-2 py-1 text-xs font-medium backdrop-blur">
            {fmtLesson(previewLesson.durationSeconds)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Curriculum({ course, totalDuration }: { course: Course; totalDuration: string | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number[]>([0]);
  const sections = course.sections;
  const toggle = (i: number) =>
    setOpen((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("curriculum")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sections.length} sections • {totalLessons} lessons{totalDuration ? ` • ${totalDuration} total` : ""}
          </p>
        </div>
        <button
          onClick={() => setOpen(open.length === sections.length ? [] : sections.map((_, i) => i))}
          className="text-sm font-medium text-primary hover:text-primary-glow transition-colors"
        >
          {open.length === sections.length ? t("collapseAll") : t("expandAll")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {sections.map((section, i) => {
          const isOpen = open.includes(i);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  <span className="font-semibold">{section.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{section.lessons.length} lessons</span>
              </button>
              {isOpen ? (
                <ul className="bg-secondary/30 divide-y divide-border/60">
                  {section.lessons.map((lesson) => {
                    const video = hasVideo(lesson);
                    const duration = fmtLesson(lesson.durationSeconds);
                    return (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 px-5 py-3 pl-12 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {video ? (
                            <PlayCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                          {lesson.isFreePreview ? (
                            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Preview
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                          {!lesson.isFreePreview ? <Lock className="h-3 w-3" /> : null}
                          {duration ? <span className="tabular-nums">{duration}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Instructor({ instructor }: { instructor: Instructor | null }) {
  const { t } = useI18n();
  if (!instructor) return null;
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-6">{t("yourInstructor")}</h2>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col sm:flex-row gap-5">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.fullName}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-primary-soft"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary ring-4 ring-primary-soft">
              {initials(instructor.fullName)}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{instructor.fullName}</h3>
            {instructor.headline ? (
              <p className="text-sm text-primary font-medium">{instructor.headline}</p>
            ) : null}
            {instructor.bio ? (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {instructor.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews({ reviews }: { reviews: ReviewsResponse | undefined }) {
  const { t } = useI18n();
  const items = reviews?.items ?? [];
  const average = reviews?.average ?? null;
  const count = reviews?.count ?? 0;

  const distribution = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((stars) => {
      const n = items.filter((r) => r.rating === stars).length;
      return { stars, pct: count > 0 ? Math.round((n / count) * 100) : 0 };
    });
    return buckets;
  }, [items, count]);

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-6">{t("studentReviews")}</h2>
      {count === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No reviews yet — be the first once you enroll.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card h-fit">
            <div className="text-center">
              <p className="text-5xl font-bold">{average?.toFixed(1)}</p>
              <div className="mt-1 flex justify-center">
                <Stars value={Math.round(average ?? 0)} size="md" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{count.toLocaleString()} reviews</p>
            </div>
            <div className="mt-6 space-y-2">
              {distribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{r.stars}</span>
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground tabular-nums">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="space-y-5">
            {items.slice(0, 8).map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {initials(r.user.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-semibold">{r.user.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment ? (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EnrollCard({ course, isFree, enrollUrl }: { course: Course; isFree: boolean; enrollUrl: string }) {
  const { t } = useI18n();
  const includes = [
    { icon: InfinityIcon, label: "Lifetime access" },
    { icon: Smartphone, label: "Watch on mobile & TV" },
    { icon: Download, label: "Downloadable resources" },
    { icon: Award, label: "Certificate of completion" },
  ];
  return (
    <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24 h-fit">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight">
          {isFree ? "Free" : `${course.price} TND`}
        </span>
      </div>

      <a
        href={enrollUrl}
        className="mt-5 block w-full rounded-xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {isFree ? t("enrollNow") : t("getCourse")}
      </a>
      {!isFree ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Secure checkout on your dashboard
        </p>
      ) : null}

      <div className="mt-6 space-y-3 text-sm">
        <p className="font-semibold">{t("includes")}</p>
        {includes.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("whatLearn")}
          </p>
          <ul className="space-y-2 text-sm">
            {course.whatYouWillLearn.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
