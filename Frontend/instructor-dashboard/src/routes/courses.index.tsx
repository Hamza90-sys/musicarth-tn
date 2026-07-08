import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/courses/")({
  component: MyCoursesPage,
});

type Course = {
  id: string;
  title: string;
  description: string;
  instrument: string;
  level: string;
  price: number | null;
  isPublished: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  instructor: { id: string } | null;
  sections: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
};

function MyCoursesPage() {
  const { t } = useI18n();
  const auth = getStoredAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const coursesQuery = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: () => apiFetch<Course[]>("/courses"),
  });

  // One click: create a draft course, then open the builder to fill in everything.
  const createCourse = useMutation({
    mutationFn: () =>
      apiFetch<Course>("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Untitled course",
          description: "Draft course — add your description in the builder.",
          instrument: "piano",
          level: "beginner",
          price: 0,
          isPublished: false,
        }),
      }),
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      navigate({ to: "/courses/$courseId", params: { courseId: course.id } });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not create course"),
  });

  const myCourses = useMemo(() => {
    const all = coursesQuery.data ?? [];
    if (!auth?.user.id) return all;
    return all.filter((c) => c.instructor?.id === auth.user.id);
  }, [coursesQuery.data, auth?.user.id]);

  const gradients = [
    "from-violet-500 to-fuchsia-500",
    "from-amber-500 to-rose-500",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("myCoursesTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("myCoursesSub2")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => createCourse.mutate()} disabled={createCourse.isPending}>
          <Plus className="h-4 w-4" /> {createCourse.isPending ? "…" : t("createNewCourse")}
        </Button>
      </div>

      {coursesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : myCourses.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No courses yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first course to start adding lessons.
              </p>
            </div>
            <Button onClick={() => createCourse.mutate()} disabled={createCourse.isPending} className="gap-2">
              <Plus className="h-4 w-4" /> {createCourse.isPending ? "…" : t("createNewCourse")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myCourses.map((c, i) => {
            const lessons = c.sections.reduce((sum, s) => sum + s.lessons.length, 0);
            return (
              <Card
                key={c.id}
                className="overflow-hidden border-border/60 shadow-soft transition-all hover:shadow-elevated"
              >
                <div className={`relative h-28 bg-gradient-to-br ${gradients[i % gradients.length]} p-4`}>
                  <span className="absolute right-3 top-3 rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                    {c.isPublished ? "Published" : "Draft"}
                  </span>
                  <span className="absolute bottom-3 left-4 text-[10px] font-medium uppercase tracking-wider text-white/90">
                    {c.instrument} · {c.level}
                  </span>
                </div>
                <CardContent className="space-y-3 p-5">
                  <div>
                    <h3 className="font-semibold">{c.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {c.enrollments.length}
                      </span>
                      <span>{lessons} lessons</span>
                      <span>{c.price ? `${c.price.toFixed(0)} TND` : "Free"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{c.isPublished ? 100 : 0}%</span>
                    </div>
                    <Progress value={c.isPublished ? 100 : 0} className="h-1.5" />
                  </div>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                      {t("manageCourse")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
