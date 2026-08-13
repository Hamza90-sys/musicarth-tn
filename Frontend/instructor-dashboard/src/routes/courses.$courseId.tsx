import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Video, Users, PlayCircle, Clock3, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/courses/$courseId")({
  component: ViewCoursePage,
});

type Lesson = {
  id: string;
  title: string;
  isFreePreview: boolean;
  durationSeconds?: number | null;
  videoStatus?: "NONE" | "PENDING" | "PROCESSING" | "READY" | "ERRORED" | null;
};
type Section = { id: string; title: string; lessons: Lesson[] };
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
  enrollments?: { id: string }[];
  sections: Section[];
};

const statusBadge = (s?: Lesson["videoStatus"]) => {
  if (s === "READY") return { label: "Ready", variant: "default" as const };
  if (s === "PROCESSING" || s === "PENDING") return { label: "Processing", variant: "secondary" as const };
  if (s === "ERRORED") return { label: "Failed", variant: "destructive" as const };
  return { label: "No video", variant: "outline" as const };
};

function ViewCoursePage() {
  const { courseId } = useParams({ from: "/courses/$courseId" });
  const courseQuery = useQuery({
    queryKey: ["instructor-course", courseId],
    queryFn: () => apiFetch<Course>(`/courses/${courseId}`),
  });
  const course = courseQuery.data;

  if (courseQuery.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading course…</div>;
  }
  if (!course) {
    return <div className="p-8 text-sm text-destructive">Course not found.</div>;
  }

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
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
          {course.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p>
          ) : null}
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{course.instrument}</Badge>
            <Badge variant="outline">{course.level}</Badge>
          </div>
        </div>
        {course.thumbnailUrl ? (
          <div className="relative aspect-video w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-border/60">
            <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-video w-full max-w-[240px] shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {course.enrollments?.length ?? 0} students
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PlayCircle className="h-4 w-4" /> {totalLessons} lessons
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-4 w-4" /> {course.price ? `${course.price.toFixed(0)} TND` : "Free"}
        </span>
        {course.includedLiveSessions && course.includedLiveSessions > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Video className="h-4 w-4" /> {course.includedLiveSessions} live sessions included
          </span>
        ) : null}
      </div>

      {/* Read-only notice */}
      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Courses are created and managed by the Musicarth team. This is a read-only view of your assigned course.
      </div>

      {(course.whatYouWillLearn?.length || course.requirements?.length) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {course.whatYouWillLearn?.length ? (
            <Card className="border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">What students learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {course.whatYouWillLearn.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          {course.requirements?.length ? (
            <Card className="border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {course.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Curriculum</h2>
        {course.sections.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No lessons have been added to this course yet.
            </CardContent>
          </Card>
        ) : (
          course.sections.map((section, si) => (
            <Card key={section.id} className="border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">
                  {si + 1}. {section.title}
                </CardTitle>
                <CardDescription>{section.lessons.length} lessons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons in this section.</p>
                ) : (
                  section.lessons.map((lesson, li) => {
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
                          {lesson.isFreePreview ? <Badge variant="outline">Free preview</Badge> : null}
                          <Badge variant={sb.variant}>{sb.label}</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
