import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { CourseCard, summarizeCourse, type RawCourse } from "@/components/CourseCard";

const fetchCourses = async (): Promise<RawCourse[]> => {
  const res = await fetch(`${API_BASE_URL}/courses`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? data.data ?? []);
};

export function CoursesGrid() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["landing-courses"],
    queryFn: fetchCourses,
  });

  const courses = (data ?? []).filter((c) => c.isPublished).slice(0, 6).map(summarizeCourse);

  return (
    <section id="courses" className="relative bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-primary">
              <span className="h-1 w-1 rounded-full bg-primary" /> {t("browseKicker")}
            </span>
            <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.03em]">
              {t("findYourNext")} <span className="italic text-gradient-primary">{t("course")}</span>.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              {t("browseSub")}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t("browseAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-surface" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="mt-12 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {t("comingSoon")}
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
