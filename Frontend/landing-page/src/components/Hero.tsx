import { motion, useScroll, useTransform } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import heroVideo from "@/assets/hero-section.mp4";

export function Hero() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-black pt-24 pb-16 md:min-h-[100vh] md:pt-32 md:pb-24">
      {/* Desktop: full-bleed background video + readability gradient (md and up only) */}
      <motion.video
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
      />
      <div className="pointer-events-none absolute inset-0 z-10 hidden bg-[linear-gradient(90deg,rgba(3,7,18,0.78)_0%,rgba(3,7,18,0.56)_34%,rgba(3,7,18,0.22)_62%,rgba(3,7,18,0.08)_100%)] md:block" />

      <div className="relative z-20 mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-6 lg:grid-cols-12">
        {/* Mobile: video in its own 16:9 block — whole frame, no crop, no dark space */}
        <motion.video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="aspect-video w-full rounded-2xl object-cover shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] md:hidden"
        />

        <motion.div style={{ y: textY }} className="relative z-20 lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t("heroBadge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]"
          >
            {t("heroTitle1")}
            <br />
            <span className="text-gradient-primary italic">{t("heroTitle2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)]"
          >
            {t("heroSub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/apply/student"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.25)]"
            >
              {t("startLearning")}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/apply/instructor"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition-all backdrop-blur-md hover:bg-white/20"
            >
              {t("becomeInstructor")}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 flex items-center gap-8 text-xs text-white/70"
          >
            <div>
              <div className="text-2xl font-display text-white">{t("heroStat1Big")}</div>
              <div className="mt-1">{t("heroStat1Sub")}</div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <div className="text-2xl font-display text-white">{t("heroStat2Big")}</div>
              <div className="mt-1">{t("heroStat2Sub")}</div>
            </div>
            <div className="hidden h-10 w-px bg-white/20 sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl font-display text-white">{t("heroStat3Big")}</div>
              <div className="mt-1">{t("heroStat3Sub")}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
