import { useEffect, useState } from "react";

export type Lang = "en" | "fr" | "ar";

const KEY = "musicarth_lang";
const EVENT = "musicarth-lang-change";

export const getLang = (): Lang => {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(KEY);
  return v === "fr" || v === "ar" ? v : "en";
};

export const setLang = (lang: Lang) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, lang);
  window.dispatchEvent(new Event(EVENT));
};

export const useLang = (): Lang => {
  const [lang, setL] = useState<Lang>(() => getLang());
  useEffect(() => {
    const sync = () => setL(getLang());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return lang;
};

// ---------------------------------------------------------------------------
// UI translations. `useT()` returns a translator bound to the active language.
// ---------------------------------------------------------------------------
const translations = {
  en: {
    menu: "Menu",
    dashboard: "Dashboard",
    myCourses: "My Courses",
    sessions: "Sessions",
    progress: "Progress",
    forum: "Forum",
    notifications: "Notifications",
    profile: "Profile",
    signOut: "Sign out",
    searchPlaceholder: "Search courses, instructors...",
    courseCatalogue: "Course catalogue",
    catalogueTitle: "Explore music courses built for steady progress.",
    catalogueSub: "search published courses, review your progress, and jump back into the lessons you started.",
    hi: "Hi",
    available: "Available",
    enrolled: "Enrolled",
    completed: "Completed",
    published: "Published",
    lessons: "Lessons",
    searchCourses: "Search title, instructor, or topic...",
    allCourses: "All courses",
    wishlist: "Wishlist",
    browseCourses: "Browse courses",
    resultsFound: "results found",
    viewDetails: "View details",
    continueLearning: "Continue learning",
    enrollNow: "Enroll now",
    free: "Free",
    sections: "sections",
  },
  fr: {
    menu: "Menu",
    dashboard: "Tableau de bord",
    myCourses: "Mes cours",
    sessions: "Sessions",
    progress: "Progression",
    forum: "Forum",
    notifications: "Notifications",
    profile: "Profil",
    signOut: "Déconnexion",
    searchPlaceholder: "Rechercher cours, instructeurs...",
    courseCatalogue: "Catalogue de cours",
    catalogueTitle: "Explorez des cours de musique conçus pour progresser pas à pas.",
    catalogueSub: "cherchez des cours publiés, suivez votre progression et reprenez vos leçons.",
    hi: "Salut",
    available: "Disponibles",
    enrolled: "Inscrits",
    completed: "Terminés",
    published: "Publiés",
    lessons: "Leçons",
    searchCourses: "Rechercher un titre, un instructeur...",
    allCourses: "Tous les cours",
    wishlist: "Favoris",
    browseCourses: "Parcourir les cours",
    resultsFound: "résultats trouvés",
    viewDetails: "Voir les détails",
    continueLearning: "Continuer",
    enrollNow: "S'inscrire",
    free: "Gratuit",
    sections: "sections",
  },
  ar: {
    menu: "القائمة",
    dashboard: "لوحة التحكم",
    myCourses: "دوراتي",
    sessions: "الجلسات",
    progress: "التقدم",
    forum: "المنتدى",
    notifications: "الإشعارات",
    profile: "الملف الشخصي",
    signOut: "تسجيل الخروج",
    searchPlaceholder: "ابحث عن دورات، مدرّسين...",
    courseCatalogue: "قائمة الدورات",
    catalogueTitle: "استكشف دورات موسيقية مصممة لتقدّم ثابت.",
    catalogueSub: "ابحث عن الدورات المنشورة وتابع تقدمك وعُد إلى دروسك.",
    hi: "مرحبًا",
    available: "متاحة",
    enrolled: "مسجّل",
    completed: "مكتملة",
    published: "منشورة",
    lessons: "الدروس",
    searchCourses: "ابحث عن عنوان أو مدرّس...",
    allCourses: "كل الدورات",
    wishlist: "المفضلة",
    browseCourses: "تصفح الدورات",
    resultsFound: "نتيجة",
    viewDetails: "عرض التفاصيل",
    continueLearning: "متابعة التعلم",
    enrollNow: "سجّل الآن",
    free: "مجاني",
    sections: "أقسام",
  },
} as const;

export type TKey = keyof typeof translations.en;

/** Translator bound to the active language (falls back to English). */
export const useT = () => {
  const lang = useLang();
  return (key: TKey): string => translations[lang][key] ?? translations.en[key];
};

type LocalizableCourse = {
  title: string;
  description: string;
  titleFr?: string | null;
  titleAr?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
};

/** Picks the localized title/description for a course, falling back to the default. */
export const localizeCourse = (c: LocalizableCourse, lang: Lang) => ({
  title: (lang === "fr" ? c.titleFr : lang === "ar" ? c.titleAr : null) || c.title,
  description:
    (lang === "fr" ? c.descriptionFr : lang === "ar" ? c.descriptionAr : null) || c.description,
});

type LocalizableLesson = {
  title: string;
  content?: string | null;
  titleFr?: string | null;
  titleAr?: string | null;
  contentFr?: string | null;
  contentAr?: string | null;
};

/** Picks the localized title/content for a lesson, falling back to the default. */
export const localizeLesson = (l: LocalizableLesson, lang: Lang) => ({
  title: (lang === "fr" ? l.titleFr : lang === "ar" ? l.titleAr : null) || l.title,
  content:
    (lang === "fr" ? l.contentFr : lang === "ar" ? l.contentAr : null) ?? l.content ?? null,
});

/** Text direction for a language — Arabic is right-to-left. */
export const dirForLang = (lang: Lang): "rtl" | "ltr" => (lang === "ar" ? "rtl" : "ltr");

/**
 * Keeps <html lang/dir> in sync with the active language so the whole app
 * mirrors to RTL when Arabic is selected. Mount once near the app root.
 */
export const useDocumentDirection = () => {
  const lang = useLang();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dirForLang(lang);
  }, [lang]);
};
