/** Official Alhajda house index — not cloned inside Waha. */
export const ALHAJDA_SITES_INDEX = "https://alhajda.com/sites";

export type HouseSiteId =
  | "tahajjud"
  | "midad"
  | "sites"
  | "mohsin"
  | "luma"
  | "alhajda-tools"
  | "agent"
  | "hissati";

export type HouseSite = {
  id: HouseSiteId;
  /** Live product URL — always https, never an in-app clone. */
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
 * Alhajda house products. Each href is the live product — Waha must not
 * iframe or reimplement Tahajjud / Midad / Mohsin.
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
    title: { ar: "مداد · قراءة", en: "Midad · Reading" },
    blurb: { ar: "مكتبة عربية للكتب المتصلة", en: "An Arabic library of connected books" },
    keywords: ["مداد", "قراءة", "كتاب", "مكتبة", "midad", "read", "library"],
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
    blurb: { ar: "ألعاب عربية من باحة الهجدة", en: "Arabic games from the Alhajda yard" },
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
    blurb: { ar: "دفتر المعلم — حصص ومتابعة", en: "A teacher’s notebook for lessons" },
    keywords: ["حصتي", "معلم", "حصة", "hissati", "teacher"],
    category: "life",
    lane: "house",
    audience: PERSONAL,
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
  return PRIMARY_LAUNCHER_IDS.map((id) => getHouseSite(id)).filter((site): site is HouseSite => site != null);
}

export function isExternalHouseSite(site: Pick<HouseSite, "href">): boolean {
  return site.href.startsWith("https://");
}
