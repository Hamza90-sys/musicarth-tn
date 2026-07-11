import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  CourseCard,
  summarizeCourse,
  type RawCourse,
  type CourseSummary,
} from "@/components/CourseCard";

type Search = { instrument?: string };

export const Route = createFileRoute("/courses/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    instrument: typeof search.instrument === "string" ? search.instrument : undefined,
  }),
  component: CatalogPage,
});

const fetchCourses = async (): Promise<RawCourse[]> => {
  const res = await fetch(`${API_BASE_URL}/courses`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? data.data ?? []);
};

// The full set of instruments a course can belong to (mirrors the instructor
// course form), so the filter always shows every category — even ones that
// don't have a published course yet.
const ALL_INSTRUMENTS = ["piano", "guitar", "violin", "drums", "oud", "voice", "theory"];

type PriceFilter = "all" | "free" | "paid";
type DurationFilter = "all" | "short" | "medium" | "long";

const PRICE_LABELS = { all: "allPrices", free: "free", paid: "paid" } as const;
const DURATION_LABELS = {
  all: "anyLength",
  short: "under1h",
  medium: "oneTo3h",
  long: "over3h",
} as const;

const inDurationBucket = (seconds: number, bucket: DurationFilter) => {
  if (bucket === "all") return true;
  if (bucket === "short") return seconds < 3600;
  if (bucket === "medium") return seconds >= 3600 && seconds <= 10800;
  return seconds > 10800;
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-foreground/70 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CatalogPage() {
  const { t } = useI18n();
  const { instrument: instrumentParam } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [instrument, setInstrument] = useState<string>(instrumentParam ?? "all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "shortest">("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-courses"],
    queryFn: fetchCourses,
  });

  const courses: CourseSummary[] = useMemo(
    () => (data ?? []).filter((c) => c.isPublished).map(summarizeCourse),
    [data],
  );

  const instruments = useMemo(() => {
    const merged = [...ALL_INSTRUMENTS];
    for (const c of courses) {
      if (!merged.includes(c.instrument)) merged.push(c.instrument);
    }
    return ["all", ...merged];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = courses.filter((c) => {
      if (instrument !== "all" && c.instrument !== instrument) return false;
      if (price === "free" && !c.isFree) return false;
      if (price === "paid" && c.isFree) return false;
      if (!inDurationBucket(c.totalDurationSeconds, duration)) return false;
      if (q && !(`${c.title} ${c.subtitle ?? ""} ${c.instructorName ?? ""}`.toLowerCase().includes(q)))
        return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === "price-desc") sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "shortest") sorted.sort((a, b) => a.totalDurationSeconds - b.totalDurationSeconds);
    return sorted; // "newest" keeps the API order (createdAt desc)
  }, [courses, instrument, price, duration, search, sort]);

  const pickInstrument = (value: string) => {
    setInstrument(value);
    navigate({
      search: value === "all" ? {} : { instrument: value },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1240px] px-6 pt-28 pb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t("exploreCourses")}</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            {t("exploreSub")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* Filters — left sidebar */}
          <aside className="h-fit space-y-7 lg:sticky lg:top-28">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("instrument")}
              </p>
              <div className="flex flex-wrap gap-2">
                {instruments.map((i) => (
                  <Chip key={i} active={instrument === i} onClick={() => pickInstrument(i)}>
                    {i === "all" ? t("all") : i}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("price")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PRICE_LABELS) as PriceFilter[]).map((p) => (
                  <Chip key={p} active={price === p} onClick={() => setPrice(p)}>
                    {t(PRICE_LABELS[p])}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("length")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DURATION_LABELS) as DurationFilter[]).map((d) => (
                  <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
                    {t(DURATION_LABELS[d])}
                  </Chip>
                ))}
              </div>
            </div>
          </aside>

          {/* Main — centered search + results */}
          <div>
            <div className="relative mx-auto mb-8 w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm outline-none focus:border-primary/50"
              />
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-3xl bg-surface" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center">
                <p className="text-lg font-medium">{t("noMatch")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("noMatchSub")}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {filtered.length} {t("coursesWord")}
                  </p>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="h-9 rounded-full border border-border bg-white px-3 text-sm"
                  >
                    <option value="newest">{t("newest")}</option>
                    <option value="price-asc">{t("priceLow")}</option>
                    <option value="price-desc">{t("priceHigh")}</option>
                    <option value="shortest">{t("shortest")}</option>
                  </select>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
