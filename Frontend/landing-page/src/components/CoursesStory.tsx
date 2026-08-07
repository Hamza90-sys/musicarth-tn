import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import piano from "@/assets/piano.png";
import guitar from "@/assets/guitar.png";
import violin from "@/assets/violin.png";
import drums from "@/assets/drums.png";
import oud from "@/assets/oud.png";
import { useI18n, type TKey } from "@/lib/i18n";

const courses: Array<{
  id: number;
  num: number;
  titleKey: TKey;
  descKey: TKey;
  instrument: string;
  weeks: number;
  lessons: number;
  levelKey: TKey;
  image: string;
  accent: string;
}> = [
  { id: 0, num: 1, titleKey: "csPianoTitle", descKey: "csPianoDesc", instrument: "piano", weeks: 12, lessons: 48, levelKey: "levelBegInt", image: piano, accent: "from-primary/40 to-primary-light/30" },
  { id: 1, num: 2, titleKey: "csGuitarTitle", descKey: "csGuitarDesc", instrument: "guitar", weeks: 10, lessons: 36, levelKey: "levelAll", image: guitar, accent: "from-amber-300/30 to-primary/30" },
  { id: 2, num: 3, titleKey: "csViolinTitle", descKey: "csViolinDesc", instrument: "violin", weeks: 16, lessons: 60, levelKey: "levelIntermediate", image: violin, accent: "from-rose-300/30 to-primary/30" },
  { id: 3, num: 4, titleKey: "csDrumsTitle", descKey: "csDrumsDesc", instrument: "drums", weeks: 8, lessons: 32, levelKey: "levelBeginner", image: drums, accent: "from-primary/40 to-fuchsia-300/30" },
  { id: 4, num: 5, titleKey: "csOudTitle", descKey: "csOudDesc", instrument: "oud", weeks: 12, lessons: 40, levelKey: "levelAll", image: oud, accent: "from-amber-400/30 to-primary/30" },
];

export function CoursesStory() {
  const { t } = useI18n();
  const label = (num: number) => `${t("csCourseWord")} ${String(num).padStart(2, "0")}`;
  const meta = (c: (typeof courses)[number]) => [
    `${c.weeks} ${t("csWeeks")}`,
    `${c.lessons} ${t("lessonsWord")}`,
    t(c.levelKey),
  ];
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
      {/* Preload every instrument image so the scroll swaps are instant (no pop-in). */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        {courses.map((c) => (
          <img key={c.id} src={c.image} alt="" width={1} height={1} decoding="async" />
        ))}
      </div>

      {/* Section header */}
      <div className="mx-auto max-w-[1280px] px-6 pt-12 pb-10 md:pt-32 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" /> {t("csKicker")}
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.03em] max-w-3xl">
            {t("csTitle1")} <span className="italic text-gradient-primary">{t("csTitle2")}</span>.
          </h2>
          <p className="mt-5 max-w-xl text-muted-foreground text-lg">
            {t("csSub")}
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
              <AnimatePresence>
                <motion.div
                  key={courses[active].id}
                  initial={{ opacity: 0, x: -120, rotate: -12, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 120, rotate: 12, scale: 0.92 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {/* Glow halo */}
                  <div className="absolute h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.45)_0%,transparent_65%)] blur-2xl animate-pulse-glow" />

                  <motion.img
                    src={courses[active].image}
                    alt={t(courses[active].titleKey)}
                    style={{ rotate }}
                    width={1280}
                    height={1280}
                    loading="eager"
                    decoding="async"
                    className="relative w-[420px] sm:w-[580px] lg:w-[720px] max-w-none animate-float-slow drop-shadow-[0_40px_50px_oklch(0.3_0.15_295/0.35)]"
                  />

                  {/* Badge */}
                  <div className="absolute top-8 left-4 sm:left-12 glass rounded-full px-3 py-1.5 text-xs text-foreground/80">
                    {label(courses[active].num)}
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
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label(c.num)}</span>
                          <span className="text-xs text-primary flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            {t("csNowPlaying")}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-2xl sm:text-3xl tracking-tight text-foreground">
                          {t(c.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(c.descKey)}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {meta(c).map((m) => (
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
                          {t("csExplore")}
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
