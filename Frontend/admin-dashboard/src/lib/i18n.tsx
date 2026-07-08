import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr" | "ar";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  en: {
    langLabel: "EN",
    menu: "Menu",
    dashboard: "Dashboard",
    applications: "Applications",
    courses: "Courses",
    sessions: "Sessions",
    users: "Users",
    reports: "Reports",
    payments: "Payments",
    payouts: "Payouts",
    payoutsSub: "Month-end instructor transfers. Pay each instructor their 70% share, then mark it paid.",
    profile: "Profile",
    notifications: "Notifications",
    searchPlaceholder: "Search courses, instructors...",
    signOut: "Sign out",
    usersSub: "Search accounts and manage roles across the platform.",
    reportsSub: "Reported forum content — review and resolve.",
    paymentsSub: "Recent transactions. Refunds return the full amount via Flouci and revoke course access.",
  },
  fr: {
    langLabel: "FR",
    menu: "Menu",
    dashboard: "Tableau de bord",
    applications: "Candidatures",
    courses: "Cours",
    sessions: "Sessions",
    users: "Utilisateurs",
    reports: "Signalements",
    payments: "Paiements",
    payouts: "Versements",
    payoutsSub: "Virements mensuels aux instructeurs. Payez leur part de 70 %, puis marquez comme payé.",
    profile: "Profil",
    notifications: "Notifications",
    searchPlaceholder: "Rechercher cours, instructeurs...",
    signOut: "Déconnexion",
    usersSub: "Recherchez les comptes et gérez les rôles.",
    reportsSub: "Contenu signalé du forum — examinez et résolvez.",
    paymentsSub: "Transactions récentes. Les remboursements passent par Flouci et révoquent l'accès.",
  },
  ar: {
    langLabel: "AR",
    menu: "القائمة",
    dashboard: "لوحة التحكم",
    applications: "الطلبات",
    courses: "الدورات",
    sessions: "الجلسات",
    users: "المستخدمون",
    reports: "البلاغات",
    payments: "المدفوعات",
    payouts: "التحويلات",
    payoutsSub: "تحويلات نهاية الشهر للمدرّسين. ادفع حصة كل مدرّس 70٪ ثم علّمها كمدفوعة.",
    profile: "الملف الشخصي",
    notifications: "الإشعارات",
    searchPlaceholder: "ابحث عن دورات، مدرّسين...",
    signOut: "تسجيل الخروج",
    usersSub: "ابحث في الحسابات وأدر الأدوار عبر المنصة.",
    reportsSub: "محتوى المنتدى المُبلَّغ عنه — راجع وحلّ.",
    paymentsSub: "المعاملات الأخيرة. الاسترداد يتم عبر Flouci ويُلغي الوصول للدورة.",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations.en) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "musicarth.admin.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in translations) setLangState(stored);
  }, []);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: keyof typeof translations.en) => translations[lang][key] ?? translations.en[key];

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
