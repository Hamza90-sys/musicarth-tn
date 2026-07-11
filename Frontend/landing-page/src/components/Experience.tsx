import { motion } from "motion/react";
import saxophone from "@/assets/saxophone.png";

const features = [
  { title: "Personalized Path", desc: "Adaptive curriculum that responds to how you play and grow.", icon: "M12 2v20M2 12h20" },
  { title: "Progress Tracking", desc: "Beautiful weekly insights, milestones, and listening rooms.", icon: "M3 3v18h18M7 14l4-4 4 4 6-6" },
  { title: "Recognized Certificates", desc: "Conservatory-grade certifications recognized by partners.", icon: "M12 2l3 7h7l-5.5 4 2 7-6.5-4-6.5 4 2-7L2 9h7z" },
  { title: "Living Community", desc: "A place to share, collaborate, and perform with peers.", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
];

export function Experience() {
  return (
    <section id="experience" className="relative overflow-hidden py-32 bg-white">
      <motion.img
        src={saxophone}
        alt=""
        aria-hidden
        width={1280}
        height={1280}
        loading="lazy"
        initial={{ opacity: 0, x: 80, rotate: 8 }}
        whileInView={{ opacity: 0.95, x: 0, rotate: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute max-w-none animate-float-slow drop-shadow-[0_40px_60px_oklch(0.3_0.15_295/0.4)] -right-8 top-6 w-[210px] sm:-right-32 sm:top-6 sm:w-[560px]"
      />
      <div className="absolute -right-10 top-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.25_293/0.3)_0%,transparent_65%)] blur-3xl -z-0 animate-pulse-glow" />

      <div className="relative mx-auto max-w-[1280px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" /> Learning Experience
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.03em]">
            Designed like a <span className="italic text-gradient-primary">composition.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Every detail of Musicarth is orchestrated — from your first lesson to your first standing ovation.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-3xl border border-border bg-white/70 backdrop-blur p-6 transition-all hover:-translate-y-1 hover:shadow-card ease-cinema duration-500"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_10px_30px_-10px_oklch(0.55_0.25_293/0.6)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-5 font-display text-xl tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
