import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  Heart,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { useStoredAuth } from "@/lib/auth";
import { localizeCourse, useLang, useT } from "@/lib/locale";

type CourseInstructor = {
  id: string;
  fullName: string;
  email: string;
};

type Lesson = {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
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

type Filter = "all" | "enrolled" | "available" | "published" | "wishlist";

const cardGradients = [
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-sky-500 via-cyan-500 to-teal-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-emerald-500 via-green-500 to-lime-500",
];

export const Route = createFileRoute("/courses/")({
  component: CoursesPage,
});

function CoursesPage() {
  const auth = useStoredAuth();
  const lang = useLang();
  const t = useT();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const coursesQuery = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => apiFetch<Course[]>("/courses"),
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => apiFetch<EnrollmentsResponse>("/enrollments/me"),
  });

  const enrollments = enrollmentsQuery.data?.data ?? [];
  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.course.id)),
    [enrollments],
  );

  const enrolledByCourseId = useMemo(() => {
    return enrollments.reduce<Record<string, Enrollment>>((accumulator, enrollment) => {
      accumulator[enrollment.course.id] = enrollment;
      return accumulator;
    }, {});
  }, [enrollments]);

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) =>
      apiFetch<Enrollment>("/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
    },
  });

  const wishlistQuery = useQuery({
    queryKey: ["student-wishlist"],
    queryFn: () => apiFetch<{ courseIds: string[] }>("/wishlist"),
  });
  const wishlist = useMemo(
    () => new Set(wishlistQuery.data?.courseIds ?? []),
    [wishlistQuery.data?.courseIds],
  );
  const wishlistToggle = useMutation({
    mutationFn: ({ courseId, wished }: { courseId: string; wished: boolean }) =>
      apiFetch(`/wishlist/${courseId}`, { method: wished ? "DELETE" : "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-wishlist"] });
    },
  });

  const courses = coursesQuery.data ?? [];

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses
      .filter((course) => {
        const lessonCount = course.sections.reduce(
          (count, section) => count + section.lessons.length,
          0,
        );
        const searchBlob = [
          course.title,
          course.description,
          course.instrument,
          course.level,
          course.instructor?.fullName ?? "",
          course.sections.map((section) => section.title).join(" "),
          lessonCount.toString(),
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = term.length === 0 || searchBlob.includes(term);
        const isEnrolled = enrolledCourseIds.has(course.id);

        const matchesFilter =
          filter === "all"
            ? true
            : filter === "enrolled"
              ? isEnrolled
              : filter === "available"
                ? course.isPublished && !isEnrolled
                : filter === "wishlist"
                  ? wishlist.has(course.id)
                  : course.isPublished;

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => {
        const leftEnrolled = enrolledCourseIds.has(left.id) ? 1 : 0;
        const rightEnrolled = enrolledCourseIds.has(right.id) ? 1 : 0;
        return rightEnrolled - leftEnrolled;
      });
  }, [courses, enrolledCourseIds, filter, search, wishlist]);

  const stats = useMemo(() => {
    const completed = enrollments.filter((enrollment) => enrollment.status === "COMPLETED").length;
    const published = courses.filter((course) => course.isPublished).length;
    const lessons = courses.reduce(
      (count, course) =>
        count + course.sections.reduce((sectionCount, section) => sectionCount + section.lessons.length, 0),
      0,
    );

    return [
      { label: t("available"), value: String(courses.length), icon: BookOpen },
      { label: t("enrolled"), value: String(enrollments.length), icon: Sparkles },
      { label: t("completed"), value: String(completed), icon: CheckCircle2 },
      { label: t("published"), value: String(published), icon: Loader2 },
      { label: t("lessons"), value: String(lessons), icon: BookOpen },
    ];
  }, [courses, enrollments]);

  const isLoading = coursesQuery.isLoading || enrollmentsQuery.isLoading;
  const apiError = coursesQuery.error ?? enrollmentsQuery.error;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {t("courseCatalogue")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("catalogueTitle")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("hi")} {auth?.user.fullName.split(" ")[0] ?? ""} — {t("catalogueSub")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px] lg:grid-cols-2">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/50 bg-background/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-4 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchCourses")}
            className="h-11 pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: t("allCourses") },
            { id: "enrolled", label: t("enrolled") },
            { id: "available", label: t("available") },
            { id: "published", label: t("published") },
            { id: "wishlist", label: t("wishlist") },
          ].map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              onClick={() => setFilter(item.id as Filter)}
              className="rounded-full"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </section>

      {apiError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load courses</AlertTitle>
          <AlertDescription>
            {apiError instanceof ApiError ? apiError.message : "Try refreshing the page."}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("browseCourses")}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredCourses.length} {t("resultsFound")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-border/60">
                <Skeleton className="h-36 w-full rounded-none" />
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No courses match your filter</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search term or reset the filter to see everything.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Reset filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course, index) => {
              const lessonCount = course.sections.reduce(
                (count, section) => count + section.lessons.length,
                0,
              );
              const sectionCount = course.sections.length;
              const enrollment = enrolledByCourseId[course.id];
              const isEnrolled = Boolean(enrollment);
              const gradient = cardGradients[index % cardGradients.length];
              const loc = localizeCourse(course, lang);

              return (
                <Card
                  key={course.id}
                  className="group overflow-hidden border-border/60 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className={`relative h-36 bg-gradient-to-br ${gradient} p-5 text-white`}>
                    <div className="flex items-start justify-between gap-3">
                      <Badge className="bg-white/15 text-white hover:bg-white/20">
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {isEnrolled ? (
                          <Badge className="bg-black/15 text-white hover:bg-black/20">
                            Enrolled · {enrollment.progress}%
                          </Badge>
                        ) : null}
                        <button
                          type="button"
                          aria-label="Toggle wishlist"
                          disabled={wishlistToggle.isPending}
                          onClick={() =>
                            wishlistToggle.mutate({ courseId: course.id, wished: wishlist.has(course.id) })
                          }
                          className="rounded-full bg-white/15 p-1.5 backdrop-blur transition-colors hover:bg-white/25"
                        >
                          <Heart
                            className={wishlist.has(course.id) ? "h-4 w-4 fill-white text-white" : "h-4 w-4 text-white/80"}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                        {course.instrument} · {course.level}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold leading-tight">{loc.title}</h3>
                    </div>
                  </div>

                  <CardContent className="space-y-4 p-5">
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {loc.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{sectionCount} sections</span>
                      <span>{lessonCount} lessons</span>
                      <span>
                        {course.sections
                          .map((section) => section.lessons.length)
                          .reduce((count, current) => count + current, 0)} lessons total
                      </span>
                      <span>{course.price === null ? "Free" : `${course.price.toFixed(0)} TND`}</span>
                    </div>

                    {isEnrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-1.5" />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                          {t("viewDetails")}
                        </Link>
                      </Button>

                      {isEnrolled ? (
                        <Button asChild className="flex-1">
                          <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                            {t("continueLearning")}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          className="flex-1"
                          disabled={!course.isPublished || enrollMutation.isPending}
                          onClick={() => enrollMutation.mutate(course.id)}
                        >
                          {enrollMutation.isPending ? "…" : t("enrollNow")}
                        </Button>
                      )}
                    </div>

                    {!course.isPublished ? (
                      <p className="text-xs text-muted-foreground">
                        This course is not published yet, so it is visible only to staff.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
