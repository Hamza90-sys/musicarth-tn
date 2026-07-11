import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import piano from "@/assets/piano.png";
import guitar from "@/assets/guitar.png";
import violin from "@/assets/violin.png";
import drums from "@/assets/drums.png";
import oud from "@/assets/oud.png";

const courses = [
  {
    id: 0,
    label: "Course 01",
    title: "Piano Foundations",
    instrument: "piano",
    desc: "Build a cinematic relationship with the keys — from your first chord to expressive performance.",
    meta: ["12 weeks", "48 lessons", "Beginner → Intermediate"],
    image: piano,
    accent: "from-primary/40 to-primary-light/30",
  },
  {
    id: 1,
    label: "Course 02",
    title: "Acoustic Guitar Craft",
    instrument: "guitar",
    desc: "Learn the warmth, rhythm, and storytelling of acoustic guitar through classic and modern repertoire.",
    meta: ["10 weeks", "36 lessons", "All levels"],
    image: guitar,
    accent: "from-amber-300/30 to-primary/30",
  },
  {
    id: 2,
    label: "Course 03",
    title: "Violin Mastery",
    instrument: "violin",
    desc: "Refine tone, vibrato, and bow control with conservatory-grade technique and orchestral pieces.",
    meta: ["16 weeks", "60 lessons", "Intermediate"],
    image: violin,
    accent: "from-rose-300/30 to-primary/30",
  },
  {
    id: 3,
    label: "Course 04",
    title: "Rhythm & Drums",
    instrument: "drums",
    desc: "Lock into the groove — develop pocket, dynamics, and the language of modern drumming.",
    meta: ["8 weeks", "32 lessons", "Beginner"],
    image: drums,
    accent: "from-primary/40 to-fuchsia-300/30",
  },
  {
    id: 4,
    label: "Course 05",
    title: "Oud & Maqam",
    instrument: "oud",
    desc: "Explore the soul of Arabic music — master the oud, its ornaments, and the language of maqam.",
    meta: ["12 weeks", "40 lessons", "All levels"],
    image: oud,
    accent: "from-amber-400/30 to-primary/30",
  },
];

export function CoursesStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const idx = Math.min(courses.length - 1, Math.max(0, Math.floor(v * courses.length)));
      setActive(idx);
    });
    return () => unsub();
  }, [scrollYProgress]);

  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <section id="courses" className="relative bg-white">
      {/* Section header */}
      <div className="mx-auto max-w-[1280px] px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" /> Featured Courses
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.03em] max-w-3xl">
            A journey through <span className="italic text-gradient-primary">every instrument</span>.
          </h2>
          <p className="mt-5 max-w-xl text-muted-foreground text-lg">
            Scroll to explore. Each course is composed like a piece of music — guided, intentional, alive.
          </p>
        </motion.div>
      </div>

      <div ref={ref} className="relative" style={{ height: `${courses.length * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Aurora background that subtly shifts */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-surface" />
            <AnimatePresence>
              <motion.div
                key={`bg-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className={`absolute inset-0 bg-gradient-to-br ${courses[active].accent} blur-3xl opacity-60`}
              />
            </AnimatePresence>
          </div>

          <div className="mx-auto grid max-w-[1280px] h-full grid-cols-1 lg:grid-cols-12 items-center gap-8 px-6">
            {/* Sticky instrument */}
            <div className="lg:col-span-7 relative h-[50vh] lg:h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={courses[active].id}
                  initial={{ opacity: 0, x: -120, rotate: -12, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 120, rotate: 12, scale: 0.92 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {/* Glow halo */}
                  <div className="absolute h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.45)_0%,transparent_65%)] blur-2xl animate-pulse-glow" />

                  <motion.img
                    src={courses[active].image}
                    alt={courses[active].title}
                    style={{ rotate }}
                    width={1280}
                    height={1280}
                    loading="lazy"
                    className="relative w-[420px] sm:w-[580px] lg:w-[720px] max-w-none animate-float-slow drop-shadow-[0_40px_50px_oklch(0.3_0.15_295/0.35)]"
                  />

                  {/* Badge */}
                  <div className="absolute top-8 left-4 sm:left-12 glass rounded-full px-3 py-1.5 text-xs text-foreground/80">
                    {courses[active].label}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Active card slot */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[340px] sm:h-[320px]">
                <AnimatePresence mode="wait">
                  {courses.map((c, i) =>
                    i === active ? (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 60, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -60, scale: 0.96 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 rounded-3xl p-6 sm:p-7 border bg-white border-primary/20 shadow-[0_30px_80px_-30px_oklch(0.55_0.25_293/0.45)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.label}</span>
                          <span className="text-xs text-primary flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            Now playing
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-2xl sm:text-3xl tracking-tight text-foreground">
                          {c.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.meta.map((m) => (
                            <span key={m} className="text-[11px] rounded-full bg-surface px-2.5 py-1 text-foreground/70">
                              {m}
                            </span>
                          ))}
                        </div>
                        <Link
                          to="/courses"
                          search={{ instrument: c.instrument }}
                          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                        >
                          Explore {c.instrument} courses
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
              </div>


              {/* Progress indicator */}
              <div className="mt-8 flex items-center gap-2">
                {courses.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ease-cinema ${
                      i === active ? "w-10 bg-primary" : "w-4 bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
