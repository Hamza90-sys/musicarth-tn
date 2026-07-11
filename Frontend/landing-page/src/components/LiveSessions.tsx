import { motion } from "motion/react";
import guitar from "@/assets/Guitar1.png";

const sessions = [
  { date: "Thu · 7 PM", title: "Pocket & Groove Workshop", instructor: "Marcus Vale", live: true, seats: 42 },
  { date: "Sat · 4 PM", title: "Rhythm Foundations Live", instructor: "Iris Tanaka", live: false, seats: 80 },
  { date: "Sun · 8 PM", title: "Drum Improv Masterclass", instructor: "Leo Hart", live: false, seats: 60 },
];

export function LiveSessions() {
  return (
    <section id="live" className="relative overflow-hidden py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-surface to-white" />
      <motion.img
        src={guitar}
        alt=""
        aria-hidden
        width={1280}
        height={1280}
        loading="lazy"
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 0.9, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -left-40 top-1/2 -translate-y-1/2 w-[720px] max-w-none animate-float-slow drop-shadow-[0_40px_60px_oklch(0.3_0.15_295/0.4)]"
      />
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.35)_0%,transparent_65%)] blur-3xl -z-10 animate-pulse-glow" />

      <div className="relative mx-auto max-w-[1280px] px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 lg:col-start-7">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live Sessions
            </span>
            <h2 className="mt-5 font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1] tracking-[-0.03em]">
              Play together,<br /><span className="italic text-gradient-primary">in real time.</span>
            </h2>
            <p className="mt-5 text-muted-foreground text-lg max-w-md">
              Weekly live cohorts and masterclasses with world-class instructors. Real feedback, real rhythm.
            </p>

            <div className="mt-8 space-y-3">
              {sessions.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-2xl glass border border-white/60 p-5 transition-all hover:shadow-soft hover:-translate-y-0.5 ease-cinema duration-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {s.date}
                        {s.live && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> LIVE
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 font-medium text-foreground">{s.title}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">with {s.instructor}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{s.seats} seats</div>
                      <button className="mt-2 inline-flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                        Join
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
