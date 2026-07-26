import { motion } from "motion/react";
import guitar from "@/assets/Guitar1.png";

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
        className="pointer-events-none absolute max-w-none animate-float-slow drop-shadow-[0_40px_60px_oklch(0.3_0.15_295/0.4)] right-4 top-24 w-[200px] sm:top-1/2 sm:-translate-y-1/2 sm:-right-6 sm:left-auto sm:w-[440px] lg:-left-20 lg:right-auto lg:w-[720px]"
      />
      <div className="hidden lg:block absolute -left-20 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.35)_0%,transparent_65%)] blur-3xl -z-10 animate-pulse-glow" />

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

            <div className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl glass border border-white/60 p-8 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="mt-4 font-medium text-foreground">No live sessions scheduled yet</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  We're lining up our first live cohorts and masterclasses. Check back soon.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
