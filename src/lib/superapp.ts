import { CATALOG } from "./catalog.ts";
import { HOUSE_SITES } from "./house-sites.ts";
import { HOUSE_INTEGRATIONS } from "./house-integrations.ts";

export type Service = {
  id: string;
  href: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  icon: string;
  pillar: string;
  keywords: string;
  category?: string;
  lane?: string;
};
const destinations: Record<string, string> = {
  chat: "/ask",
  madar: "/madar",
  clips: "/clips",
  midad: "/books",
};
const essentials: Service[] = [
  {
    id: "store",
    href: "/store",
    title: { ar: "المتجر", en: "Store" },
    blurb: { ar: "منتجاتنا المجانية ومكتبتك", en: "Our free products and your library" },
    icon: "ShoppingBag",
    pillar: "learn",
    keywords: "متجر سوق منتجات مكتبة مجاني store shop",
  },
  {
    id: "dallah",
    href: "/play/dallah",
    title: { ar: "قفز الدلّة", en: "Dallah Jump" },
    blurb: { ar: "قفزة بلمسة عبر كثبان نجد", en: "One-touch jumps over Najd dunes" },
    icon: "Gamepad2",
    pillar: "fun",
    keywords: "دلة دله دلّة قفز لعبة لعب لمعة",
  },
  {
    id: "hayat-world",
    href: "/play/hayat-world",
    title: { ar: "حياة · عالم مفتوح", en: "Hayat Open World" },
    blurb: { ar: "مدينة ثلاثية الأبعاد من لُمعة", en: "A 3D city from Luma" },
    icon: "Gamepad2",
    pillar: "fun",
    keywords: "عالم حياة لمعة مدينة سيارات",
  },
  {
    id: "alhajda-book",
    href: "/books/alhajda",
    title: { ar: "الهجدة · الكتاب", en: "Alhajda · Book" },
    blurb: { ar: "تابع القراءة من موضعك المحفوظ", en: "Resume from your saved reading position" },
    icon: "BookOpen",
    pillar: "learn",
    keywords: "كتاب الهجدة قراءة فصول",
  },
  {
    id: "news",
    href: "/news",
    title: { ar: "الأخبار والموجز", en: "News & briefing" },
    blurb: { ar: "آخر العناوين بمصادرها", en: "Headlines with sources" },
    icon: "Newspaper",
    pillar: "news",
    keywords: "وش صار اليوم موجز أخبار اخبار بث",
  },
  {
    id: "quran",
    href: "/quran",
    title: { ar: "القرآن والورد", en: "Quran & wird" },
    blurb: { ar: "مصحفك وموضع قراءتك", en: "Your mushaf and reading position" },
    icon: "BookOpen",
    pillar: "faith",
    keywords: "قرآن قران ورد مصحف",
  },
  {
    id: "forum",
    href: "/forum",
    title: { ar: "المجالس", en: "Community" },
    blurb: { ar: "أقسام النقاش في واحة", en: "Waha discussion boards" },
    icon: "MessagesSquare",
    pillar: "news",
    keywords: "منتدى نقاش مجالس",
  },
];
const house = HOUSE_SITES.filter((s) => s.directory || s.id === "sites").map((s) => ({
  category: ["market", "hudoo", "manteq"].includes(s.id) ? "money" : "life",
  id: s.id,
  href: HOUSE_INTEGRATIONS[s.id],
  title: s.title,
  blurb: s.blurb,
  icon: s.icon,
  pillar:
    s.id === "tahajjud"
      ? "faith"
      : ["luma", "hayat", "samar"].includes(s.id)
        ? "fun"
        : ["market", "hudoo", "manteq"].includes(s.id)
          ? "news"
          : "learn",
  keywords: s.keywords.join(" "),
}));
export const SERVICES: readonly Service[] = [
  ...essentials,
  ...house,
  ...CATALOG.filter((s) => !house.some((h) => h.id === s.id)).map((s) => ({
    category: s.category,
    lane: s.lane,
    id: s.id,
    href: destinations[s.id] || HOUSE_INTEGRATIONS[s.id] || `/app/${s.id}`,
    title: s.title,
    blurb: s.blurb,
    icon: s.icon,
    pillar:
      s.lane === "worship"
        ? "faith"
        : s.category === "games"
          ? "fun"
          : s.category === "money"
            ? "news"
            : "learn",
    keywords: `${s.lane} ${s.category}`,
  })),
];
export const HOME_SERVICE_IDS = [
  "store",
  "camera",
  "weather",
  "calc",
  "search",
  "browser",
  "video",
  "tahajjud",
  "quran",
  "news",
  "hissati",
  "midad",
  "mohsin",
  "luma",
  "dallah",
  "baloot",
  "sites",
  "alhajda-tools",
  "agent",
];
export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}
export function findServices(query: string, pillar = "all") {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return SERVICES.filter(
    (s) =>
      (pillar === "all" || s.pillar === pillar) &&
      terms.every((term) =>
        normalizeSearch(
          `${s.title.ar} ${s.title.en} ${s.blurb.ar} ${s.blurb.en} ${s.keywords} ${s.id}`,
        ).includes(term),
      ),
  );
}
export type LocalProgress = { days: string[] };
export function progressState(raw: unknown): LocalProgress {
  const days =
    raw && typeof raw === "object" && "days" in raw && Array.isArray(raw.days) ? raw.days : [];
  return {
    days: [
      ...new Set(
        days.filter(
          (s): s is string =>
            typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)),
        ),
      ),
    ]
      .sort()
      .slice(-366),
  };
}
export function progressSummary(progress: LocalProgress, today: string) {
  const days = progressState(progress).days.filter((d) => d <= today);
  let cursor = Date.parse(today + "T12:00:00Z");
  if (!days.includes(today)) cursor -= 86400000;
  let streak = 0;
  while (days.includes(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= 86400000;
  }
  return { xp: days.length * 10, streak, done: days.includes(today) };
}
