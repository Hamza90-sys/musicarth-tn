import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Plus, Users, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/courses/")({
  component: AdminCoursesPage,
});

type Course = {
  id: string;
  title: string;
  description: string;
  instrument: string;
  level: string;
  price: number | null;
  isPublished: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  instructor: { id: string; fullName: string; email: string } | null;
  sections: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
};

const FILTERS = ["ALL", "PUBLISHED", "DRAFT", "PENDING"] as const;

function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  const coursesQuery = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => apiFetch<Course[]>("/courses"),
  });

  // Admin creates a draft course, then opens the builder to pick the instructor
  // and add lessons/videos.
  const createCourse = useMutation({
    mutationFn: () =>
      apiFetch<Course>("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Untitled course",
          description: "Draft course — add the details in the builder.",
          instrument: "piano",
          level: "beginner",
          price: 0,
          isPublished: false,
        }),
      }),
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      navigate({ to: "/courses/$courseId", params: { courseId: course.id } });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not create course"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      apiFetch(`/admin/courses/${id}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not update course"),
  });

  const courses = useMemo(() => {
    const all = coursesQuery.data ?? [];
    if (filter === "ALL") return all;
    if (filter === "PUBLISHED") return all.filter((c) => c.isPublished);
    if (filter === "DRAFT") return all.filter((c) => !c.isPublished);
    return all.filter((c) => c.approvalStatus === "PENDING");
  }, [coursesQuery.data, filter]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create courses, assign them to an instructor, and upload the videos.
          </p>
        </div>
        <Button className="gap-2" onClick={() => createCourse.mutate()} disabled={createCourse.isPending}>
          <Plus className="h-4 w-4" /> {createCourse.isPending ? "Creating…" : "New course"}
        </Button>
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

      {coursesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center text-sm text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            No {filter === "ALL" ? "" : filter.toLowerCase()} courses.
            <Button className="gap-2" onClick={() => createCourse.mutate()} disabled={createCourse.isPending}>
              <Plus className="h-4 w-4" /> New course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => {
            const lessons = c.sections.reduce((sum, s) => sum + s.lessons.length, 0);
            return (
              <Card key={c.id} className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{c.instrument}</Badge>
                        <Badge variant="outline">{c.level}</Badge>
                        <Badge variant={c.isPublished ? "default" : "outline"}>
                          {c.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {c.approvalStatus === "PENDING" ? (
                          <Badge variant="outline">Pending</Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{c.description}</p>
                    </div>
                    <Button asChild variant="outline" className="shrink-0 gap-1.5">
                      <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                        Manage <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Instructor:{" "}
                      <span className={c.instructor ? "font-medium text-foreground" : "text-destructive"}>
                        {c.instructor?.fullName ?? "Not assigned"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {c.enrollments.length}
                    </span>
                    <span>{lessons} lessons</span>
                    <span>{c.price ? `${c.price.toFixed(0)} TND` : "Free"}</span>
                  </div>

                  {c.approvalStatus === "PENDING" ? (
                    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: c.id, status: "APPROVED" })}
                      >
                        <Check className="h-4 w-4" /> Approve &amp; publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: c.id, status: "REJECTED" })}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
