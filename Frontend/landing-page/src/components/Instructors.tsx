import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";

type FeaturedInstructor = {
  id: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  instrument: string | null;
  rating: number | null;
  students: number;
  courseCount: number;
};

const fetchInstructors = async (): Promise<FeaturedInstructor[]> => {
  const res = await fetch(`${API_BASE_URL}/courses/instructors/featured`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function Instructors() {
  const { data } = useQuery({ queryKey: ["featured-instructors"], queryFn: fetchInstructors });

  const people = data ?? [];
  // Hide the whole section until there are real instructors to show.
  if (people.length === 0) return null;

  return (
    <section id="instructors" className="relative py-32 bg-surface overflow-hidden">
      <div className="absolute inset-0 -z-10 aurora-bg opacity-50" />
      <div className="relative mx-auto max-w-[1280px] px-6">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs text-primary">
              <span className="h-1 w-1 rounded-full bg-primary" /> Instructors
            </span>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.03em]">
              Learn from the <span className="italic text-gradient-primary">orchestra.</span>
            </h2>
          </motion.div>
          <a
            href="/courses"
            className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            Explore their courses
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {people.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl bg-foreground"
            >
              <div className="aspect-[3/4] overflow-hidden">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.fullName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-cinema group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-light font-display text-5xl text-white">
                    {initials(p.fullName)}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              {p.rating != null ? (
                <div className="absolute top-3 right-3 rounded-full glass-dark px-2.5 py-1 text-[11px] text-white flex items-center gap-1">
                  <svg className="h-3 w-3 fill-primary-light text-primary-light" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4-6.5 4 2-7L2 9h7z"/></svg>
                  {p.rating.toFixed(1)}
                </div>
              ) : null}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="font-display text-xl tracking-tight">{p.fullName}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-white/70">
                  <span className="truncate capitalize">{p.headline ?? p.instrument ?? "Instructor"}</span>
                  {p.students > 0 ? <span className="shrink-0">{p.students} students</span> : null}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
