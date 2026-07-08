import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Users, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/courses")({
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
  instructor: { fullName: string; email: string } | null;
  sections: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  const coursesQuery = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => apiFetch<Course[]>("/courses"),
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
    onError: (e) => alert(e instanceof ApiError ? e.message : "Could not update course"),
  });

  const courses = useMemo(() => {
    const all = coursesQuery.data ?? [];
    return filter === "ALL" ? all : all.filter((c) => c.approvalStatus === filter);
  }, [coursesQuery.data, filter]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review instructor courses and approve them to publish on the platform.
        </p>
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
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-sm text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            No {filter === "ALL" ? "" : filter.toLowerCase()} courses.
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
                        <Badge
                          variant={
                            c.approvalStatus === "APPROVED"
                              ? "default"
                              : c.approvalStatus === "REJECTED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {c.approvalStatus}
                        </Badge>
                        {c.isPublished ? <Badge>Published</Badge> : null}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>By {c.instructor?.fullName ?? "—"}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {c.enrollments.length}
                    </span>
                    <span>{lessons} lessons</span>
                    <span>{c.price ? `${c.price.toFixed(0)} TND` : "Free"}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={reviewMutation.isPending || c.approvalStatus === "APPROVED"}
                      onClick={() => reviewMutation.mutate({ id: c.id, status: "APPROVED" })}
                    >
                      <Check className="h-4 w-4" /> Approve &amp; publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={reviewMutation.isPending || c.approvalStatus === "REJECTED"}
                      onClick={() => reviewMutation.mutate({ id: c.id, status: "REJECTED" })}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
