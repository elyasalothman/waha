/** Official Alhajda house index and full-site source URLs. */
export const ALHAJDA_SITES_INDEX = "https://alhajda.com/sites";

export type HouseSiteId =
  | "tahajjud"
  | "midad"
  | "sites"
  | "mohsin"
  | "luma"
  | "alhajda-tools"
  | "agent"
  | "hissati"
  | "home"
  | "studio"
  | "hayat"
  | "samar"
  | "market"
  | "amlak"
  | "qararak"
  | "manba"
  | "khazana"
  | "hudoo"
  | "manteq"
  | "himaya";

export type HouseSite = {
  id: HouseSiteId;
  /** Full source product URL; native feature destinations live in house-integrations. */
  href: string;
  host: string;
  icon: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  keywords: string[];
  category: "life";
  lane: "house";
  audience: Array<"personal" | "work">;
  /** Shown as a launcher card in the app grid. */
  launcher: boolean;
  /** Shown in the in-app مواقعنا short list. */
  directory: boolean;
};

const PERSONAL: Array<"personal" | "work"> = ["personal"];
const BOTH: Array<"personal" | "work"> = ["personal", "work"];

type HouseSiteDraft = Omit<HouseSite, "host">;

/**
 * Alhajda house products. Each href remains the full source product.
 * Waha provides internal features where supported.
 */
const HOUSE_SITE_DRAFTS: readonly HouseSiteDraft[] = [
  {
    id: "tahajjud",
    href: "https://tahajjud.alhajda.com",
    icon: "Moon",
    title: { ar: "تهجد · عبادة", en: "Tahajjud · Worship" },
    blurb: { ar: "مواقيت وأذكار ومصحف", en: "Prayer times, athkar, and a mushaf" },
    keywords: ["تهجد", "صلاة", "أذكار", "قرآن", "tahajjud", "prayer", "athkar"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "midad",
    href: "https://midad.alhajda.com/library",
    icon: "BookMarked",
    title: { ar: "مداد · رف كتب", en: "Midad · Book shelf" },
    blurb: {
      ar: "أخلاق وشرعي ومداد — روابط معلَّمة المصدر",
      en: "Akhlaq, sharia, and Midad — source-stamped links",
    },
    keywords: [
      "مداد",
      "قراءة",
      "كتاب",
      "كتب",
      "رف",
      "مكتبة",
      "midad",
      "read",
      "library",
      "books",
      "shelf",
    ],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "sites",
    href: "https://alhajda.com/sites",
    icon: "PanelsTopLeft",
    title: { ar: "مواقعنا", en: "Our sites" },
    blurb: { ar: "فهرس مواقع بيت الهجدة", en: "Index of the Alhajda house sites" },
    keywords: ["مواقعنا", "مواقع", "فهرس", "هجدة", "alhajda", "sites"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: true,
    directory: false,
  },
  {
    id: "mohsin",
    href: "https://ai.alhajda.com",
    icon: "Sparkles",
    title: { ar: "محسن", en: "Mohsin" },
    blurb: { ar: "مساعد الهجدة للكتابة والسؤال", en: "The house assistant for writing and asking" },
    keywords: ["محسن", "ذكاء", "مساعد", "mohsin", "mohsen", "ai"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
  {
    id: "luma",
    href: "https://games.alhajda.com",
    icon: "Gamepad2",
    title: { ar: "لُمعة", en: "Luma" },
    blurb: { ar: "27 لعبة عربية من باحة الهجدة", en: "27 Arabic games from the Alhajda yard" },
    keywords: ["ألعاب", "العاب", "لمة", "لمعة", "luma", "games", "play"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
  {
    id: "alhajda-tools",
    href: "https://tools.alhajda.com",
    icon: "Wrench",
    title: { ar: "أدوات", en: "Tools" },
    blurb: { ar: "حاسبات ومرافق بيت الهجدة", en: "House calculators and utilities" },
    keywords: ["أدوات", "ادوات", "حاسبة", "tools", "calc"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
  {
    id: "agent",
    href: "https://agent.alhajda.com",
    icon: "Bot",
    title: { ar: "وكيل", en: "Agent" },
    blurb: { ar: "وكيل الهجدة للمهام المتصلة", en: "The house agent for connected tasks" },
    keywords: ["وكيل", "agent"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
  {
    id: "hissati",
    href: "https://hissati.alhajda.com",
    icon: "GraduationCap",
    title: { ar: "حصتي", en: "Hissati" },
    blurb: {
      ar: "دفتر المعلم لمدرستي · تحضير أسبوعي وكشف الدرجات",
      en: "Teacher notebook for Madrasati · weekly plans and grades",
    },
    keywords: ["حصتي", "معلم", "حصة", "hissati", "teacher"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
  {
    id: "home",
    href: "https://alhajda.com",
    icon: "Globe",
    title: { ar: "بيت الهجدة", en: "Alhajda home" },
    blurb: { ar: "المساحة الرئيسية لكل مواقعنا", en: "The home of our sites" },
    keywords: ["بيت الهجدة", "Alhajda home", "home"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "studio",
    href: "https://hajdah.com",
    icon: "Palette",
    title: { ar: "هجدة · الاستوديو", en: "Hajdah · Studio" },
    blurb: { ar: "استوديو هجدة ومشاريعه", en: "Hajdah studio and projects" },
    keywords: ["هجدة · الاستوديو", "Hajdah · Studio", "studio"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "hayat",
    href: "https://hayat.alhajda.com",
    icon: "Gamepad2",
    title: { ar: "حياة", en: "Hayat" },
    blurb: {
      ar: "لعبة حياة — عالم تلعبه بنافذة كاملة",
      en: "Hayat game — a world to play in a full window",
    },
    keywords: ["حياة", "Hayat", "hayat"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "samar",
    href: "https://luma.alhajda.com",
    icon: "Dices",
    title: { ar: "لُمعة · سَمَر", en: "Luma · Samar" },
    blurb: { ar: "لعبة عربية للمجلس والعائلة", en: "An Arabic game for family gatherings" },
    keywords: ["لُمعة · سَمَر", "Luma · Samar", "samar"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "market",
    href: "https://market.alhajda.com",
    icon: "TrendingUp",
    title: { ar: "السوق", en: "Market" },
    blurb: { ar: "منضدة أسعار السوق ومتابعتها", en: "A desk for market prices and watchlists" },
    keywords: ["السوق", "Market", "market"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "amlak",
    href: "https://amlak.alhajda.com",
    icon: "Building2",
    title: { ar: "أملاك", en: "Amlak" },
    blurb: { ar: "وحدات وعقود وصيانة العقار", en: "Property units, leases and maintenance" },
    keywords: ["أملاك", "Amlak", "amlak"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "qararak",
    href: "https://qararak.alhajda.com",
    icon: "ListChecks",
    title: { ar: "قرارك", en: "Qararak" },
    blurb: { ar: "مساحة عربية لتوضيح القرار", en: "An Arabic space for clearer decisions" },
    keywords: ["قرارك", "Qararak", "qararak"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "manba",
    href: "https://manba.alhajda.com",
    icon: "Palette",
    title: { ar: "منبع", en: "Manba" },
    blurb: { ar: "أصول رقمية صُمّمت للعربية", en: "Digital assets designed for Arabic" },
    keywords: ["منبع", "Manba", "manba"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "khazana",
    href: "https://khazana.alhajda.com",
    icon: "Boxes",
    title: { ar: "الخزانة", en: "Khazana" },
    blurb: { ar: "مواقع صغيرة مستقلة في مكان واحد", en: "Small independent sites in one place" },
    keywords: ["الخزانة", "Khazana", "khazana"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "hudoo",
    href: "https://hudoo.alhajda.com",
    icon: "Globe",
    title: { ar: "هدوء", en: "Hudoo" },
    blurb: { ar: "قناة هدوء السوق", en: "Hudoo · Alhajda house" },
    keywords: ["هدوء", "Hudoo"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "manteq",
    href: "https://manteq.alhajda.com",
    icon: "Globe",
    title: { ar: "منطق", en: "Manteq" },
    blurb: { ar: "إشارات ورقية للسوق", en: "Manteq · Alhajda house" },
    keywords: ["منطق", "Manteq"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
  {
    id: "himaya",
    href: "https://himaya.alhajda.com",
    icon: "Globe",
    title: { ar: "حماية", en: "Himaya" },
    blurb: { ar: "إضافة حجب الإعلانات", en: "Himaya · Alhajda house" },
    keywords: ["حماية", "Himaya"],
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: false,
    directory: true,
  },
];

export const HOUSE_SITES: readonly HouseSite[] = HOUSE_SITE_DRAFTS.map((site) => ({
  ...site,
  host: new URL(site.href).hostname.replace(/^www\./, ""),
}));

export const PRIMARY_LAUNCHER_IDS: readonly HouseSiteId[] = ["tahajjud", "midad", "sites"];

export function getHouseSite(id: string): HouseSite | undefined {
  return HOUSE_SITES.find((site) => site.id === id);
}

export function launcherHouseSites(): HouseSite[] {
  return HOUSE_SITES.filter((site) => site.launcher);
}

export function directoryHouseSites(): HouseSite[] {
  return HOUSE_SITES.filter((site) => site.directory);
}

export function primaryLauncherHouseSites(): HouseSite[] {
  return PRIMARY_LAUNCHER_IDS.map((id) => getHouseSite(id)).filter(
    (site): site is HouseSite => site != null,
  );
}

export function isExternalHouseSite(site: Pick<HouseSite, "href">): boolean {
  return site.href.startsWith("https://");
}

export const HOUSE_GROUPS = [
  { ar: "إيمان", en: "Faith", ids: ["tahajjud"] },
  { ar: "قراءة", en: "Reading", ids: ["midad"] },
  { ar: "لعب", en: "Play", ids: ["luma", "samar", "hayat"] },
  { ar: "مال", en: "Money", ids: ["hudoo", "market", "manteq", "qararak"] },
  {
    ar: "عمل وتعليم",
    en: "Work & learning",
    ids: ["hissati", "amlak", "alhajda-tools", "manba", "mohsin", "agent"],
  },
  { ar: "حماية", en: "Protection", ids: ["himaya"] },
  { ar: "الخزانة والبيت", en: "House & directory", ids: ["khazana", "home", "studio"] },
] as const;
