import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr" | "ar";

const translations = {
  en: {
    // navbar
    navCourses: "Courses",
    navExperience: "Experience",
    navLive: "Live",
    navInstructors: "Instructors",
    navPricing: "Pricing",
    login: "Login",
    startFree: "Start Free",
    // hero
    heroTitle1: "Learn music",
    heroTitle2: "beyond limits.",
    heroSub:
      "A modern, immersive platform for learning music with world-class instructors, live sessions, and cinematic learning experiences.",
    startLearning: "Start Learning",
    becomeInstructor: "Become an Instructor",
    // courses grid
    browseKicker: "Browse the catalogue",
    findYourNext: "Find your next",
    course: "course",
    browseSub: "Pick a course to see the full curriculum, preview lessons, and enroll.",
    browseAll: "Browse all courses",
    comingSoon: "New courses are coming soon. Check back shortly.",
    free: "Free",
    lessonsWord: "lessons",
    // catalog
    exploreCourses: "Explore courses",
    exploreSub: "Filter by instrument, price, and length — then open a course to see the full curriculum and preview lessons.",
    instrument: "Instrument",
    price: "Price",
    length: "Length",
    all: "All",
    allPrices: "All prices",
    paid: "Paid",
    anyLength: "Any length",
    under1h: "Under 1h",
    oneTo3h: "1–3 hours",
    over3h: "3h+",
    searchPlaceholder: "Search courses or instructors…",
    noMatch: "No courses match these filters",
    noMatchSub: "Try widening your filters or clearing the search.",
    coursesWord: "courses",
    newest: "Newest",
    priceLow: "Price: low to high",
    priceHigh: "Price: high to low",
    shortest: "Shortest first",
    // course detail
    aboutCourse: "About this course",
    curriculum: "Curriculum",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    requirements: "Requirements",
    yourInstructor: "Your instructor",
    studentReviews: "Student reviews",
    enrollNow: "Enroll now",
    getCourse: "Get this course",
    includes: "This course includes:",
    whatLearn: "What you'll learn",
    students: "students",
    reviews: "reviews",
    preview: "Preview",
  },
  fr: {
    navCourses: "Cours",
    navExperience: "Expérience",
    navLive: "En direct",
    navInstructors: "Instructeurs",
    navPricing: "Tarifs",
    login: "Connexion",
    startFree: "Commencer",
    heroTitle1: "Apprenez la musique",
    heroTitle2: "sans limites.",
    heroSub:
      "Une plateforme moderne et immersive pour apprendre la musique avec des instructeurs de classe mondiale, des sessions en direct et des expériences cinématiques.",
    startLearning: "Commencer à apprendre",
    becomeInstructor: "Devenir instructeur",
    browseKicker: "Parcourir le catalogue",
    findYourNext: "Trouvez votre prochain",
    course: "cours",
    browseSub: "Choisissez un cours pour voir le programme complet, les leçons d'aperçu, et vous inscrire.",
    browseAll: "Voir tous les cours",
    comingSoon: "De nouveaux cours arrivent bientôt. Revenez vite.",
    free: "Gratuit",
    lessonsWord: "leçons",
    exploreCourses: "Explorer les cours",
    exploreSub: "Filtrez par instrument, prix et durée — puis ouvrez un cours pour voir le programme complet.",
    instrument: "Instrument",
    price: "Prix",
    length: "Durée",
    all: "Tous",
    allPrices: "Tous les prix",
    paid: "Payant",
    anyLength: "Toutes durées",
    under1h: "Moins d'1h",
    oneTo3h: "1–3 heures",
    over3h: "3h+",
    searchPlaceholder: "Rechercher des cours ou instructeurs…",
    noMatch: "Aucun cours ne correspond",
    noMatchSub: "Élargissez vos filtres ou effacez la recherche.",
    coursesWord: "cours",
    newest: "Plus récents",
    priceLow: "Prix : croissant",
    priceHigh: "Prix : décroissant",
    shortest: "Les plus courts",
    aboutCourse: "À propos de ce cours",
    curriculum: "Programme",
    expandAll: "Tout déplier",
    collapseAll: "Tout replier",
    requirements: "Prérequis",
    yourInstructor: "Votre instructeur",
    studentReviews: "Avis des élèves",
    enrollNow: "S'inscrire",
    getCourse: "Obtenir ce cours",
    includes: "Ce cours comprend :",
    whatLearn: "Ce que vous apprendrez",
    students: "élèves",
    reviews: "avis",
    preview: "Aperçu",
  },
  ar: {
    navCourses: "الدورات",
    navExperience: "التجربة",
    navLive: "مباشر",
    navInstructors: "المدرّسون",
    navPricing: "الأسعار",
    login: "تسجيل الدخول",
    startFree: "ابدأ مجانًا",
    heroTitle1: "تعلّم الموسيقى",
    heroTitle2: "بلا حدود.",
    heroSub:
      "منصة حديثة وغامرة لتعلّم الموسيقى مع مدرّسين من الطراز العالمي وجلسات مباشرة وتجارب تعليمية سينمائية.",
    startLearning: "ابدأ التعلم",
    becomeInstructor: "كن مدرّسًا",
    browseKicker: "تصفح القائمة",
    findYourNext: "اعثر على",
    course: "دورتك القادمة",
    browseSub: "اختر دورة لرؤية المنهج الكامل ودروس المعاينة والتسجيل.",
    browseAll: "تصفح كل الدورات",
    comingSoon: "دورات جديدة قادمة قريبًا.",
    free: "مجاني",
    lessonsWord: "درسًا",
    exploreCourses: "استكشف الدورات",
    exploreSub: "صفِّ حسب الآلة والسعر والمدة — ثم افتح دورة لرؤية المنهج الكامل.",
    instrument: "الآلة",
    price: "السعر",
    length: "المدة",
    all: "الكل",
    allPrices: "كل الأسعار",
    paid: "مدفوع",
    anyLength: "أي مدة",
    under1h: "أقل من ساعة",
    oneTo3h: "1–3 ساعات",
    over3h: "+3 ساعات",
    searchPlaceholder: "ابحث عن دورات أو مدرّسين…",
    noMatch: "لا توجد دورات مطابقة",
    noMatchSub: "وسّع الفلاتر أو امسح البحث.",
    coursesWord: "دورة",
    newest: "الأحدث",
    priceLow: "السعر: من الأدنى",
    priceHigh: "السعر: من الأعلى",
    shortest: "الأقصر أولًا",
    aboutCourse: "عن هذه الدورة",
    curriculum: "المنهج",
    expandAll: "توسيع الكل",
    collapseAll: "طي الكل",
    requirements: "المتطلبات",
    yourInstructor: "مدرّسك",
    studentReviews: "آراء الطلاب",
    enrollNow: "سجّل الآن",
    getCourse: "احصل على الدورة",
    includes: "تشمل هذه الدورة:",
    whatLearn: "ماذا ستتعلم",
    students: "طالبًا",
    reviews: "تقييمًا",
    preview: "معاينة",
  },
} as const;

export type TKey = keyof typeof translations.en;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "musicarth.landing.lang";

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

  const t = (key: TKey) => translations[lang][key] ?? translations.en[key];

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
