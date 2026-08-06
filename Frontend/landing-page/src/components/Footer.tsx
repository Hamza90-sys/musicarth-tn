import { useI18n, type Lang, type TKey } from "@/lib/i18n";

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function Footer() {
  const { lang, setLang, t } = useI18n();
  const cols: Array<{ title: TKey; items: Array<{ label: TKey; href: string }> }> = [
    {
      title: "footerColPlatform",
      items: [
        { label: "navCourses", href: "#courses" },
        { label: "navLive", href: "#live" },
        { label: "navInstructors", href: "#instructors" },
        { label: "navPricing", href: "#pricing" },
      ],
    },
    {
      title: "footerColCompany",
      items: [
        { label: "footAbout", href: "/about" },
        { label: "footCareers", href: "/apply/instructor" },
        { label: "footPrivacy", href: "/privacy" },
        { label: "footTerms", href: "/terms" },
      ],
    },
    {
      title: "footerColContact",
      items: [
        { label: "footEmailUs", href: "mailto:musicarthtn@gmail.com" },
        { label: "footBecomeInstructor", href: "/apply/instructor" },
        { label: "footJoinStudent", href: "/apply/student" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ff_100%)] text-slate-800">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.06),transparent_40%)]"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center">
              <img
                src="/musicarth.png"
                alt="Musicarth"
                className="block h-10 w-auto object-contain"
                draggable="false"
              />
            </div>

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-600">
              {t("footerTagline")}
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
                {
                  label: "Instagram",
                  href: "#",
                  d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                },
                {
                  label: "Facebook",
                  href: "#",
                  d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-primary hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t(c.title)}</div>
              <ul className="mt-5 space-y-3 text-sm">
                {c.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      className="text-slate-700 transition-colors hover:text-slate-950"
                    >
                      {t(it.label)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-violet-200/80 pt-6">
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} Musicarth. {t("footerRights")}</div>
          <div className="flex items-center gap-4 text-xs text-slate-700">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1 shadow-sm">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    lang === l.code
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <a href="/privacy" className="hover:text-slate-950">
              {t("footPrivacy")}
            </a>
            <a href="/terms" className="hover:text-slate-950">
              {t("footTerms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
