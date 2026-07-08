import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type PlatformReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { fullName: string };
};
type ReviewsResponse = { count: number; minimum: number; items: PlatformReview[] };

const fetchReviews = async (): Promise<ReviewsResponse> => {
  const res = await fetch(`${API_BASE_URL}/platform-reviews`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

/**
 * Real student testimonials (submitted from the student dashboard after
 * finishing a lesson). The whole section stays hidden until more than the
 * server-side minimum (15) students have rated the platform.
 */
export function Testimonials() {
  const { data } = useQuery({ queryKey: ["platform-reviews"], queryFn: fetchReviews });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  // Duplicate the row so the marquee loops seamlessly.
  const row = [...items, ...items];

  return (
    <section className="relative py-32 overflow-hidden bg-white">
      <div className="mx-auto max-w-[1280px] px-6 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" /> Testimonials
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.03em]">
            Voices from the <span className="italic text-gradient-primary">stage.</span>
          </h2>
        </motion.div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex w-max animate-marquee gap-5 px-6">
          {row.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className="w-[360px] sm:w-[420px] shrink-0 rounded-3xl glass border border-white/70 p-6 shadow-soft"
            >
              <svg className="h-6 w-6 text-primary/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 7H5a2 2 0 00-2 2v4a2 2 0 002 2h2v2a2 2 0 01-2 2H4v2h1a4 4 0 004-4V7zm12 0h-4a2 2 0 00-2 2v4a2 2 0 002 2h2v2a2 2 0 01-2 2h-1v2h1a4 4 0 004-4V7z" />
              </svg>
              <p className="mt-4 text-foreground/90 leading-relaxed">{t.comment}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-xs font-semibold text-white">
                  {t.user.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.user.fullName}</div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
