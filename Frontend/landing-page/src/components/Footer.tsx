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
                "M22 5.8a8.5 8.5 0 01-2.4.7 4.2 4.2 0 001.8-2.3 8.4 8.4 0 01-2.7 1 4.2 4.2 0 00-7.2 3.8A12 12 0 013 4.8a4.2 4.2 0 001.3 5.6 4.2 4.2 0 01-1.9-.5v.1a4.2 4.2 0 003.4 4.1 4.2 4.2 0 01-1.9.1 4.2 4.2 0 003.9 2.9A8.5 8.5 0 012 18.6a12 12 0 006.5 1.9c7.8 0 12-6.5 12-12.1v-.6A8.5 8.5 0 0022 5.8z",
                "M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1 .8-.2 1.7-.3 2.5-.3.9 0 1.7.1 2.5.3 1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z",
                "M16 8a6 6 0 016 6v6h-4v-6a2 2 0 00-4 0v6h-4v-6a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 110-4 2 2 0 010 4z",
              ].map((d, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-primary hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d={d} />
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
