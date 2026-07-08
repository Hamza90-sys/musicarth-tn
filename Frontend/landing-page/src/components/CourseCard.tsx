import { Link } from "@tanstack/react-router";
import { PlayCircle, Clock, PlaySquare } from "lucide-react";

export type RawCourse = {
  id: string;
  title: string;
  subtitle?: string | null;
  instrument: string;
  level: string;
  price: number | null;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  instructor?: { fullName: string } | null;
  sections?: Array<{ lessons: Array<{ durationSeconds?: number | null }> }>;
  enrollments?: Array<{ id: string }>;
};

export type CourseSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  instrument: string;
  level: string;
  price: number | null;
  thumbnailUrl: string | null;
  instructorName: string | null;
  totalLessons: number;
  totalDurationSeconds: number;
  enrolledCount: number;
  isFree: boolean;
};

export const summarizeCourse = (c: RawCourse): CourseSummary => {
  const lessons = (c.sections ?? []).flatMap((s) => s.lessons ?? []);
  const totalDurationSeconds = lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle ?? null,
    instrument: c.instrument,
    level: c.level,
    price: c.price,
    thumbnailUrl: c.thumbnailUrl ?? null,
    instructorName: c.instructor?.fullName ?? null,
    totalLessons: lessons.length,
    totalDurationSeconds,
    enrolledCount: c.enrollments?.length ?? 0,
    isFree: c.price == null || c.price === 0,
  };
};

export const fmtDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function CourseCard({ course }: { course: CourseSummary }) {
  const duration = fmtDuration(course.totalDurationSeconds);
  return (
    <Link
      to="/courses/$courseId"
      params={{ courseId: course.id }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-card transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/30 to-primary-light/20">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlayCircle className="h-12 w-12 text-primary/60" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize text-primary backdrop-blur">
          {course.instrument}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
          {course.isFree ? "Free" : `${course.price} TND`}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold tracking-tight leading-snug line-clamp-2">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {course.subtitle ?? `By ${course.instructorName ?? "Musicarth instructor"}`}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs text-muted-foreground">
          <span className="capitalize">{course.level}</span>
          {course.totalLessons > 0 ? (
            <span className="inline-flex items-center gap-1">
              <PlaySquare className="h-3.5 w-3.5" /> {course.totalLessons} lessons
            </span>
          ) : null}
          {duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {duration}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
