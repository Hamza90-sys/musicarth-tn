import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr";

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
    heroBadge: "Now welcoming our first students",
    heroStat1Big: "Vetted",
    heroStat1Sub: "instructors",
    heroStat2Big: "Flexible",
    heroStat2Sub: "live sessions",
    heroStat3Big: "Lifetime",
    heroStat3Sub: "access",
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
    // experience section
    expKicker: "Learning Experience",
    expTitle1: "Designed like a",
    expTitle2: "composition.",
    expSub: "Every detail of Musicarth is orchestrated — from your first lesson to your first standing ovation.",
    expFeat1Title: "Personalized Path",
    expFeat1Desc: "Adaptive curriculum that responds to how you play and grow.",
    expFeat2Title: "Progress Tracking",
    expFeat2Desc: "Beautiful weekly insights, milestones, and listening rooms.",
    expFeat3Title: "Recognized Certificates",
    expFeat3Desc: "Conservatory-grade certifications recognized by partners.",
    expFeat4Title: "Living Community",
    expFeat4Desc: "A place to share, collaborate, and perform with peers.",
    // live sessions section
    liveKicker: "Live Sessions",
    liveTitle1: "Play together,",
    liveTitle2: "in real time.",
    liveSub: "Weekly live cohorts and masterclasses with world-class instructors. Real feedback, real rhythm.",
    liveEmptyTitle: "No live sessions scheduled yet",
    liveEmptyBody: "We're lining up our first live cohorts and masterclasses. Check back soon.",
    // instructors section
    instKicker: "Instructors",
    instTitle1: "Learn from the",
    instTitle2: "orchestra.",
    instExplore: "Explore their courses",
    instRole: "Instructor",
    // testimonials section
    testKicker: "Testimonials",
    testTitle1: "Voices from the",
    testTitle2: "stage.",
    // featured courses (scroll story)
    csKicker: "Featured Courses",
    csTitle1: "A journey through",
    csTitle2: "every instrument",
    csSub: "Scroll to explore. Each course is composed like a piece of music — guided, intentional, alive.",
    csNowPlaying: "Now playing",
    csExplore: "Explore courses",
    csCourseWord: "Course",
    csWeeks: "weeks",
    levelBegInt: "Beginner → Intermediate",
    levelAll: "All levels",
    levelIntermediate: "Intermediate",
    levelBeginner: "Beginner",
    csPianoTitle: "Piano Foundations",
    csPianoDesc: "Build a cinematic relationship with the keys — from your first chord to expressive performance.",
    csGuitarTitle: "Acoustic Guitar Craft",
    csGuitarDesc: "Learn the warmth, rhythm, and storytelling of acoustic guitar through classic and modern repertoire.",
    csViolinTitle: "Violin Mastery",
    csViolinDesc: "Refine tone, vibrato, and bow control with conservatory-grade technique and orchestral pieces.",
    csDrumsTitle: "Rhythm & Drums",
    csDrumsDesc: "Lock into the groove — develop pocket, dynamics, and the language of modern drumming.",
    csOudTitle: "Oud & Maqam",
    csOudDesc: "Explore the soul of Arabic music — master the oud, its ornaments, and the language of maqam.",
    // final CTA section
    ctaKicker: "Begin your composition",
    ctaTitle1: "Start your",
    ctaTitle2: "musical journey",
    ctaTitle3: "today.",
    ctaSub: "Join a growing community learning music as it was meant to be experienced — beautifully, deeply, together.",
    ctaFine: "Vetted instructors · Pay per course · Lifetime access",
    // footer
    footerTagline: "A modern, immersive platform for learning music with world-class instructors and cinematic experiences.",
    footerColPlatform: "Platform",
    footerColCompany: "Company",
    footerColContact: "Contact",
    footAbout: "About",
    footCareers: "Careers",
    footPrivacy: "Privacy",
    footTerms: "Terms",
    footEmailUs: "Email us",
    footBecomeInstructor: "Become an instructor",
    footJoinStudent: "Join as a student",
    footerRights: "Composed with care.",
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
    heroBadge: "Nous accueillons nos premiers élèves",
    heroStat1Big: "Vérifiés",
    heroStat1Sub: "instructeurs",
    heroStat2Big: "Flexibles",
    heroStat2Sub: "sessions en direct",
    heroStat3Big: "À vie",
    heroStat3Sub: "accès",
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
    // experience section
    expKicker: "Expérience d'apprentissage",
    expTitle1: "Conçu comme une",
    expTitle2: "composition.",
    expSub: "Chaque détail de Musicarth est orchestré — de votre première leçon à votre première ovation.",
    expFeat1Title: "Parcours personnalisé",
    expFeat1Desc: "Un programme adaptatif qui s'ajuste à votre façon de jouer et de progresser.",
    expFeat2Title: "Suivi des progrès",
    expFeat2Desc: "De superbes analyses hebdomadaires, des étapes clés et des salles d'écoute.",
    expFeat3Title: "Certificats reconnus",
    expFeat3Desc: "Des certifications de niveau conservatoire reconnues par nos partenaires.",
    expFeat4Title: "Communauté vivante",
    expFeat4Desc: "Un espace pour partager, collaborer et jouer avec d'autres.",
    // live sessions section
    liveKicker: "Sessions en direct",
    liveTitle1: "Jouez ensemble,",
    liveTitle2: "en temps réel.",
    liveSub: "Des cohortes en direct et des masterclasses chaque semaine avec des instructeurs de classe mondiale. De vrais retours, un vrai rythme.",
    liveEmptyTitle: "Aucune session en direct prévue pour l'instant",
    liveEmptyBody: "Nous préparons nos premières cohortes et masterclasses en direct. Revenez bientôt.",
    // instructors section
    instKicker: "Instructeurs",
    instTitle1: "Apprenez auprès de",
    instTitle2: "l'orchestre.",
    instExplore: "Découvrir leurs cours",
    instRole: "Instructeur",
    // testimonials section
    testKicker: "Témoignages",
    testTitle1: "Les voix de",
    testTitle2: "la scène.",
    // featured courses (scroll story)
    csKicker: "Cours à la une",
    csTitle1: "Un voyage à travers",
    csTitle2: "chaque instrument",
    csSub: "Faites défiler pour explorer. Chaque cours est composé comme un morceau de musique — guidé, intentionnel, vivant.",
    csNowPlaying: "En cours de lecture",
    csExplore: "Découvrir les cours",
    csCourseWord: "Cours",
    csWeeks: "semaines",
    levelBegInt: "Débutant → Intermédiaire",
    levelAll: "Tous niveaux",
    levelIntermediate: "Intermédiaire",
    levelBeginner: "Débutant",
    csPianoTitle: "Les bases du piano",
    csPianoDesc: "Créez une relation cinématique avec le clavier — de votre premier accord à une interprétation expressive.",
    csGuitarTitle: "L'art de la guitare acoustique",
    csGuitarDesc: "Apprenez la chaleur, le rythme et l'expression de la guitare acoustique à travers un répertoire classique et moderne.",
    csViolinTitle: "Maîtrise du violon",
    csViolinDesc: "Affinez le son, le vibrato et le maniement de l'archet avec une technique de niveau conservatoire et des pièces orchestrales.",
    csDrumsTitle: "Rythme & batterie",
    csDrumsDesc: "Entrez dans le groove — développez la précision, les nuances et le langage de la batterie moderne.",
    csOudTitle: "Oud & Maqam",
    csOudDesc: "Explorez l'âme de la musique arabe — maîtrisez le oud, ses ornements et le langage du maqam.",
    // final CTA section
    ctaKicker: "Commencez votre composition",
    ctaTitle1: "Commencez votre",
    ctaTitle2: "voyage musical",
    ctaTitle3: "dès aujourd'hui.",
    ctaSub: "Rejoignez une communauté grandissante qui apprend la musique comme elle devrait être vécue — avec beauté, profondeur, ensemble.",
    ctaFine: "Instructeurs vérifiés · Paiement par cours · Accès à vie",
    // footer
    footerTagline: "Une plateforme moderne et immersive pour apprendre la musique avec des instructeurs de classe mondiale et des expériences cinématiques.",
    footerColPlatform: "Plateforme",
    footerColCompany: "Entreprise",
    footerColContact: "Contact",
    footAbout: "À propos",
    footCareers: "Carrières",
    footPrivacy: "Confidentialité",
    footTerms: "Conditions",
    footEmailUs: "Écrivez-nous",
    footBecomeInstructor: "Devenir instructeur",
    footJoinStudent: "Rejoindre en tant qu'élève",
    footerRights: "Composé avec soin.",
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

  const dir: "ltr" | "rtl" = "ltr";

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
