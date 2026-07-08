import { motion } from "motion/react";
import piano from "@/assets/piano.png";
import guitar from "@/assets/guitar.png";
import violin from "@/assets/violin.png";
import drums from "@/assets/drums.png";
import { DASHBOARD_URLS } from "@/lib/dashboard-links";

export function FinalCTA() {
  return (
    <section id="pricing" className="relative overflow-hidden py-40">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-surface to-white" />
      <div className="absolute inset-0 -z-10 aurora-bg opacity-80" />

      {/* Harmony of instruments */}
      <motion.img src={piano} alt="" aria-hidden width={1280} height={1280} loading="lazy"
        initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 0.4, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.1 }}
        className="pointer-events-none absolute -left-40 bottom-0 w-[520px] max-w-none animate-float-slow"
      />
      <motion.img src={violin} alt="" aria-hidden width={1280} height={1280} loading="lazy"
        initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 0.35, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="pointer-events-none absolute -right-32 top-10 w-[420px] max-w-none animate-float-slow"
        style={{ animationDelay: "1s" }}
      />
      <motion.img src={guitar} alt="" aria-hidden width={1280} height={1280} loading="lazy"
        initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 0.3, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.3 }}
        className="pointer-events-none absolute right-10 bottom-0 w-[360px] max-w-none animate-float-slow"
        style={{ animationDelay: "2s" }}
      />
      <motion.img src={drums} alt="" aria-hidden width={1280} height={1280} loading="lazy"
        initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 0.28, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="pointer-events-none absolute left-1/3 top-0 w-[300px] max-w-none animate-float-slow"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.4)_0%,transparent_65%)] blur-3xl animate-pulse-glow" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Begin your composition
          </span>
          <h2 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em]">
            Start your <span className="italic text-gradient-primary">musical journey</span> today.
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
            Join 120,000+ students learning music as it was meant to be experienced — beautifully, deeply, together.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={DASHBOARD_URLS.student}
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-medium text-background transition-all hover:bg-primary hover:shadow-[0_20px_50px_-15px_oklch(0.55_0.25_293/0.7)]"
            >
              Start Learning
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href={DASHBOARD_URLS.instructor}
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-medium text-foreground transition-all hover:bg-white/90"
            >
              Become Instructor
            </a>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">No credit card · 14-day free trial · Cancel anytime</div>
        </motion.div>
      </div>
    </section>
  );
}
