import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Star,
  User,
  Video,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, buildApiUrl } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { localizeCourse, localizeLesson, useLang } from "@/lib/locale";
import { LessonPlayer } from "@/components/lesson-player";
import { CourseReviews } from "@/components/course-reviews";
import {
  RatePlatformDialog,
  useMyPlatformReview,
  wasRateDismissed,
} from "@/components/rate-platform-dialog";

const downloadCertificate = async (courseId: string) => {
  const auth = getStoredAuth();
  const res = await fetch(buildApiUrl(`/courses/${courseId}/certificate`), {
    headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
  });
  if (!res.ok) {
    alert("Complete the course to download your certificate.");
    return;
  }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), "_blank");
};

const hasVideo = (lesson: Lesson) =>
  Boolean(lesson.videoUrl) ||
  (lesson.videoStatus === "READY" && Boolean(lesson.muxPlaybackId));

type CourseInstructor = {
  id: string;
  fullName: string;
  email: string;
};

type Lesson = {
  id: string;
  title: string;
  titleFr?: string | null;
  titleAr?: string | null;
  content?: string | null;
  contentFr?: string | null;
  contentAr?: string | null;
  videoUrl?: string | null;
  muxPlaybackId?: string | null;
  videoStatus?: "NONE" | "PENDING" | "PROCESSING" | "READY" | "ERRORED" | null;
  durationSeconds?: number | null;
  order: number;
};

type Section = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  titleFr?: string | null;
  titleAr?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  instrument: string;
  level: string;
  price: number | null;
  includedLiveSessions?: number;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  instructor: CourseInstructor | null;
  sections: Section[];
};

type Enrollment = {
  id: string;
  courseId: string;
  progress: number;
  status: "ACTIVE" | "COMPLETED";
  course: {
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
  };
};

type EnrollmentsResponse = {
  source: "db" | "cache";
  data: Enrollment[];
};

type LessonProgress = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  watchPositionSeconds: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CourseProgress = {
  courseId: string;
  enrollment: {
    id: string;
    progress: number;
    status: "ACTIVE" | "COMPLETED";
    completedAt: string | null;
  } | null;
  progress: number;
  totalLessons: number;
  lessonProgress: LessonProgress[];
};

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const lang = useLang();
  const queryClient = useQueryClient();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const myPlatformReview = useMyPlatformReview();

  const courseQuery = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: () => apiFetch<Course>(`/courses/${courseId}`),
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => apiFetch<EnrollmentsResponse>("/enrollments/me"),
  });

  const enrollments = enrollmentsQuery.data?.data ?? [];
  const enrollment = enrollments.find((item) => item.course.id === courseId);

  const progressQuery = useQuery({
    queryKey: ["student-course-progress", courseId],
    queryFn: () => apiFetch<CourseProgress>(`/courses/${courseId}/progress`),
    enabled: Boolean(courseQuery.data),
  });

  const enrollMutation = useMutation({
    mutationFn: () =>
      apiFetch<Enrollment>("/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-enrollments"] }),
        queryClient.invalidateQueries({ queryKey: ["student-courses"] }),
        queryClient.invalidateQueries({ queryKey: ["student-course", courseId] }),
        queryClient.invalidateQueries({ queryKey: ["student-course-progress", courseId] }),
      ]);
    },
  });

  const [couponCode, setCouponCode] = useState("");
  const buyMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ link: string }>(`/payments/course/${courseId}`, {
        method: "POST",
        body: JSON.stringify(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
      }),
    onSuccess: (data) => {
      // Off to the Flouci hosted checkout.
      window.location.href = data.link;
    },
    onError: (error) => {
      alert(error instanceof ApiError ? error.message : "Could not start the payment.");
    },
  });

  const progressMutation = useMutation({
    mutationFn: (payload: {
      lessonId: string;
      watchPositionSeconds: number;
      completed?: boolean;
    }) =>
      apiFetch(`/lessons/${payload.lessonId}/progress`, {
        method: "POST",
        body: JSON.stringify({
          watchPositionSeconds: Math.max(0, Math.floor(payload.watchPositionSeconds)),
          completed: payload.completed ?? false,
        }),
      }),
    onSuccess: async (_data, variables) => {
      // After finishing a lesson, invite the student to rate Musicarth —
      // only if they haven't rated before and didn't dismiss it this session.
      if (
        variables.completed &&
        !myPlatformReview.data?.review &&
        !wasRateDismissed()
      ) {
        setRateOpen(true);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-course-progress", courseId] }),
        queryClient.invalidateQueries({ queryKey: ["student-enrollments"] }),
        queryClient.invalidateQueries({ queryKey: ["student-courses"] }),
        queryClient.invalidateQueries({ queryKey: ["student-course", courseId] }),
      ]);
    },
  });

  const course = courseQuery.data;
  const totalLessons =
    course?.sections.reduce(
      (count, section) => count + section.lessons.length,
      0,
    ) ?? 0;
  const lessons = useMemo(
    () => course?.sections.flatMap((section) => section.lessons) ?? [],
    [course?.sections],
  );
  const lessonProgressById = useMemo(
    () =>
      new Map(
        (progressQuery.data?.lessonProgress ?? []).map((progress) => [
          progress.lessonId,
          progress,
        ]),
      ),
    [progressQuery.data?.lessonProgress],
  );
  const selectedLesson = useMemo(() => {
    if (!lessons.length) {
      return null;
    }

    return (
      lessons.find((lesson) => lesson.id === selectedLessonId) ??
      lessons.find((lesson) => hasVideo(lesson)) ??
      lessons[0]
    );
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId && selectedLesson) {
      setSelectedLessonId(selectedLesson.id);
    }
  }, [selectedLesson, selectedLessonId]);

  const isLoading = courseQuery.isLoading || enrollmentsQuery.isLoading;
  const apiError = courseQuery.error ?? enrollmentsQuery.error;

  const saveProgress = (lessonId: string, watchPositionSeconds: number, completed = false) => {
    if (!enrollment) {
      return;
    }

    progressMutation.mutate({
      lessonId,
      watchPositionSeconds,
      completed,
    });
  };

  const switchLesson = (lessonId: string) => {
    // LessonPlayer persists the final watch position on unmount when the
    // selected lesson changes, so we only need to update the selection here.
    setSelectedLessonId(lessonId);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (apiError || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:px-8">
        <Alert variant="destructive">
          <AlertTitle>Course not available</AlertTitle>
          <AlertDescription>
            {apiError instanceof ApiError
              ? apiError.message
              : "We couldn't load this course. It may have been removed."}
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <Button variant="ghost" asChild className="w-fit gap-2 px-2 text-muted-foreground">
        <Link to="/courses">
          <ArrowLeft className="h-4 w-4" />
          Back to catalogue
        </Link>
      </Button>

      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{course.isPublished ? "Published" : "Draft"}</Badge>
              {enrollment ? (
                <Badge variant="secondary">Enrolled · {enrollment.progress}%</Badge>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Course details
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {localizeCourse(course, lang).title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {localizeCourse(course, lang).description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">{course.instrument}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="secondary">
                  {course.price === null ? "Free" : `${course.price.toFixed(0)} TND`}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {course.instructor?.fullName ?? "Musicarth instructor"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.sections.length} sections
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" />
                {totalLessons} lessons
              </span>
              {course.includedLiveSessions && course.includedLiveSessions > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  <Video className="h-4 w-4" />
                  {course.includedLiveSessions} live{" "}
                  {course.includedLiveSessions === 1 ? "session" : "sessions"} included
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                Updated {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {enrollment ? (
              <div className="max-w-xl space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Your progress</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-1.5" />
                {enrollment.progress >= 100 || enrollment.status === "COMPLETED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadCertificate(courseId)}
                  >
                    <Award className="h-4 w-4" />
                    Download certificate
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <Card className="w-full max-w-md border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Course status
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {enrollment ? "Keep learning" : "Start learning"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Sections</span>
                  <span className="font-medium text-foreground">{course.sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lessons</span>
                  <span className="font-medium text-foreground">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Instructor</span>
                  <span className="font-medium text-foreground">
                    {course.instructor?.fullName ?? "TBA"}
                  </span>
                </div>
              </div>

              {enrollment ? (
                <Button asChild className="w-full">
                  <Link to="/courses">
                    <CheckCircle2 className="h-4 w-4" />
                    Continue learning
                  </Link>
                </Button>
              ) : course.price != null && course.price > 0 ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={!course.isPublished || buyMutation.isPending}
                    onClick={() => buyMutation.mutate()}
                  >
                    {buyMutation.isPending ? "Starting checkout…" : `Buy for ${course.price} TND`}
                  </Button>
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code (optional)"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm uppercase placeholder:normal-case"
                  />
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={!course.isPublished || enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate()}
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll now"}
                </Button>
              )}

              {!course.isPublished ? (
                <p className="text-xs text-muted-foreground">
                  This course is not published yet. It will appear in the catalogue when ready.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)]">
            {selectedLesson ? (
              <div className="space-y-4">
                <div className="border-b border-border/60 px-6 pt-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                    Now playing
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {localizeLesson(selectedLesson, lang).title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {localizeLesson(selectedLesson, lang).content ??
                      "Lesson video and progress are synced automatically."}
                  </p>
                </div>
                <LessonPlayer
                  key={selectedLesson.id}
                  lesson={selectedLesson}
                  onSaveProgress={saveProgress}
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background text-center">
                <div>
                  <PlayCircle className="mx-auto h-12 w-12 text-primary" />
                  <p className="mt-3 text-sm font-medium">Trailer preview coming soon</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The first lesson video will appear here when available.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  Curriculum
                </p>
                <h2 className="mt-2 text-xl font-semibold">Course structure</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore the sections and lessons that make up this course.
                </p>
              </div>

              <div className="space-y-4">
                {course.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {sectionIndex + 1}
                      </span>
                      <h3 className="text-base font-semibold">{section.title}</h3>
                    </div>
                    {section.lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-9">No lessons yet.</p>
                    ) : (
                      <div className="space-y-2 pl-9">
                        {section.lessons.map((lesson, lessonIndex) => {
                          const lessonProgress = lessonProgressById.get(lesson.id);
                          const isSelected = selectedLesson?.id === lesson.id;
                          const localized = localizeLesson(lesson, lang);

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => switchLesson(lesson.id)}
                              className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                isSelected
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border/60 bg-muted/20 hover:border-primary/30"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {sectionIndex + 1}.{lessonIndex + 1} {localized.title}
                                </p>
                                {localized.content ? (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {localized.content}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {lesson.durationSeconds ? `${lesson.durationSeconds} sec` : "No duration set"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={lessonProgress?.completed ? "default" : "outline"}>
                                  {hasVideo(lesson) ? "Video" : "Reading"}
                                </Badge>
                                {lessonProgress?.completed ? (
                                  <span className="text-[11px] text-primary">Completed</span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <CourseReviews
            courseId={courseId}
            canReview={Boolean(enrollment && enrollment.progress >= 30)}
          />
          <RatePlatformDialog open={rateOpen} onOpenChange={setRateOpen} />
        </div>

        <aside className="space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  Instructor
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  {course.instructor?.fullName ?? "Instructor TBA"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course.instructor?.email ?? "The instructor profile will appear here."}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Publish status</span>
                  <span className="font-medium text-foreground">
                    {course.isPublished ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last update</span>
                  <span className="font-medium text-foreground">
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total lessons</span>
                  <span className="font-medium text-foreground">{totalLessons}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="space-y-3 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  What you’ll cover
                </p>
                <h3 className="mt-2 text-lg font-semibold">Learning outcomes</h3>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {course.sections.length > 0 ? (
                  course.sections.slice(0, 4).map((section) => (
                    <div
                      key={section.id}
                      className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                    >
                      {section.title}
                    </div>
                  ))
                ) : (
                  <p>No curriculum has been added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
