import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";

const links: Array<{ key: "navCourses" | "navExperience" | "navLive" | "navInstructors" | "navPricing"; href?: string; to?: string }> = [
  { key: "navCourses", to: "/courses" },
  { key: "navExperience", href: "/#experience" },
  { key: "navLive", href: "/#live" },
  { key: "navInstructors", href: "/#instructors" },
  { key: "navPricing", href: "/#pricing" },
];

const LANGS: Lang[] = ["en", "fr", "ar"];

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1180px,calc(100%-2rem))]"
    >
      <nav
        className={`flex items-center justify-between gap-6 rounded-full border border-white/60 px-5 py-2.5 text-foreground transition-all duration-500 ease-cinema ${
          scrolled
            ? "bg-white/82 backdrop-blur-sm shadow-soft"
            : "bg-white/70 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        }`}
      >
        <a href="#" className="flex items-center gap-2.5">
          <img
            src="/musicarth.png"
            alt="Musicarth"
            className="block h-8 w-auto shrink-0 object-contain sm:h-9"
            draggable="false"
          />
        </a>

        <ul className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <li key={l.key}>
              {l.to ? (
                <Link
                  to={l.to}
                  className="relative rounded-full px-3.5 py-2 text-foreground/75 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  {t(l.key)}
                </Link>
              ) : (
                <a
                  href={l.href}
                  className="relative rounded-full px-3.5 py-2 text-foreground/75 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  {t(l.key)}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-border/60 p-0.5 sm:flex">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase transition-colors ${
                  lang === l ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className="hidden px-3.5 py-2 text-sm text-foreground/75 transition-colors hover:text-foreground sm:inline-flex"
          >
            {t("login")}
          </Link>
          <Link
            to="/apply/student"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-[0_10px_30px_-10px_oklch(0.55_0.25_293/0.55)]"
          >
            {t("startFree")}
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
