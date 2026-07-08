import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, BookOpen, User, MessagesSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

type CourseHit = {
  id: string;
  title: string;
  description: string;
  instrument: string;
  level: string;
  price: number | null;
  instructor: { fullName: string } | null;
};
type InstructorHit = { id: string; fullName: string; bio: string | null };
type ThreadHit = { id: string; title: string; category: string; body: string };
type SearchResponse = {
  query: string;
  courses: CourseHit[];
  instructors: InstructorHit[];
  threads: ThreadHit[];
  meta: { meiliConfigured: boolean };
};

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(q);

  useEffect(() => {
    setTerm(q);
  }, [q]);

  const searchQuery = useQuery({
    queryKey: ["search", q],
    queryFn: () => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(q)}`),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: term.trim() } });
  };

  const data = searchQuery.data;
  const empty =
    data && data.courses.length === 0 && data.instructors.length === 0 && data.threads.length === 0;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find courses, instructors, and forum threads.</p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search piano, jazz, an instructor…"
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" className="h-11">Search</Button>
      </form>

      {searchQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : !data ? null : empty ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No results{q ? ` for "${q}"` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {data.courses.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Courses
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {data.courses.map((c) => (
                  <Link
                    key={c.id}
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{c.instrument}</Badge>
                      <Badge variant="outline">{c.level}</Badge>
                      <Badge variant="secondary">{c.price ? `${c.price.toFixed(0)} TND` : "Free"}</Badge>
                    </div>
                    <p className="mt-2 font-medium">{c.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.instructor?.fullName ?? "MUSICARTH instructor"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {data.instructors.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <User className="h-4 w-4" /> Instructors
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {data.instructors.map((i) => (
                  <div key={i.id} className="rounded-xl border border-border/60 p-4">
                    <p className="font-medium">{i.fullName}</p>
                    {i.bio ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.bio}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {data.threads.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <MessagesSquare className="h-4 w-4" /> Forum
              </h2>
              <div className="space-y-3">
                {data.threads.map((t) => (
                  <Link
                    key={t.id}
                    to="/forum/$threadId"
                    params={{ threadId: t.id }}
                    className="block rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <Badge variant="secondary">{t.category}</Badge>
                    <p className="mt-2 font-medium">{t.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.body}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {!data.meta.meiliConfigured ? (
            <p className="text-xs text-muted-foreground">
              Search is running on the database. Configure Meilisearch (MEILI_HOST) for faster,
              typo-tolerant results.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
