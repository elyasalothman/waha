import { LEARNING_TRACKS, MIDAD_BOOKS } from "./sources.ts";
import { CATALOG } from "../catalog.ts";
import { HOUSE_SITES } from "../house-sites.ts";
import { HOUSE_INTEGRATIONS } from "../house-integrations.ts";
import { PRO_TOOLS } from "./pro.ts";

export type StoreCategory = "pro" | "learn" | "books" | "games" | "faith";
export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  category: StoreCategory;
  icon: string;
  source: string;
  sourceUrl: string;
  href: string;
  price: number;
  currency: "SAR";
  type: "own" | "affiliate";
  affiliate: { enabled: false; url: null };
  childSafe: boolean;
  /** Pro tools only: honest generic reference to what comparable paid products cost. */
  marketRef?: string;
  features?: string[];
};
export const STORE_CATEGORIES: { id: StoreCategory; label: string }[] = [
  { id: "pro", label: "بدائل المدفوع" },
  { id: "learn", label: "تعلّم" },
  { id: "books", label: "كتب" },
  { id: "games", label: "ألعاب" },
  { id: "faith", label: "عبادة" },
];
const free = {
  price: 0,
  currency: "SAR",
  type: "own",
  affiliate: { enabled: false, url: null },
} as const;
export const PRO_SECTION_TITLE = "بدائل مجانية لبرامج مدفوعة";
export const STORE_PRODUCTS: readonly StoreProduct[] = [
  ...PRO_TOOLS.map((t) => ({
    ...free,
    id: t.id,
    name: t.name,
    description: t.description,
    category: "pro" as const,
    icon: t.icon,
    source: "واحة · أدوات احترافية",
    sourceUrl: `https://waha.hajdah.com/pro/${t.slug}`,
    href: `/pro/${t.slug}`,
    childSafe: true,
    marketRef: t.marketRef,
    features: t.features,
  })),
  ...LEARNING_TRACKS.map((t) => ({
    ...free,
    id: `hissati-${t.id}`,
    name: t.title,
    description: `${t.description} ${t.lessons} دروس. اختر هذا المسار من موسوعة حصتي بعد الفتح.`,
    category: "learn" as const,
    icon: "GraduationCap",
    source: "حصتي · موسوعة التعلّم",
    sourceUrl: "https://hissati.alhajda.com/explore",
    href: "/app/hissati",
    childSafe: !["invest", "money", "finance", "entrepreneurship"].includes(t.id),
  })),
  ...MIDAD_BOOKS.map((b) => ({
    ...free,
    id: b.id,
    name: b.title,
    description: `${b.category} · ${b.author} · ${b.chapterCount} فصول`,
    category: "books" as const,
    icon: "BookOpen",
    source: b.source,
    sourceUrl: "https://midad.alhajda.com/library",
    href: `/books/library/${b.id}`,
    childSafe: b.audience === "أطفال" || b.audience === "يافعون",
  })),
  ...HOUSE_SITES.filter((s) => ["tahajjud", "luma", "hayat", "samar"].includes(s.id)).map((s) => ({
    ...free,
    id: s.id,
    name: s.title.ar,
    description: s.blurb.ar,
    category: s.id === "tahajjud" ? ("faith" as const) : ("games" as const),
    icon: s.icon,
    source: "بيت الهجدة",
    sourceUrl: s.href,
    href: HOUSE_INTEGRATIONS[s.id],
    childSafe: s.id === "tahajjud",
  })),
  {
    ...free,
    id: "video",
    name: "فيديو · مشهد",
    description:
      "منصة فيديو عربية من الهجدة: أخبار وتعليم وقرآن وتقنية وطبخ ورياضة وأطفال ووثائقيات، بمشغّل يوتيوب الرسمي ومقاطع حرة الترخيص.",
    category: "learn" as const,
    icon: "Clapperboard",
    source: "بيت الهجدة · مشهد",
    sourceUrl: "https://tube.alhajda.com",
    href: "/app/video",
    childSafe: false,
  },
  ...CATALOG.filter((s) => s.category === "games" && !s.href).map((s) => ({
    ...free,
    id: `game-${s.id}`,
    name: s.title.ar,
    description: s.blurb.ar,
    category: "games" as const,
    icon: s.icon,
    source: "واحة · ألعابنا",
    sourceUrl: "https://waha.hajdah.com/games",
    href: `/app/${s.id}`,
    childSafe: s.id !== "baloot",
  })),
];
export function visibleProducts(child = false) {
  return STORE_PRODUCTS.filter((p) => p.type === "own" && (!child || p.childSafe));
}
export function normalizeLibrary(raw: unknown): string[] {
  const ids = new Set(STORE_PRODUCTS.map((p) => p.id));
  return Array.isArray(raw)
    ? [...new Set(raw.filter((id): id is string => typeof id === "string" && ids.has(id)))]
    : [];
}
export function acquireProduct(raw: unknown, id: string, child = false): string[] {
  const library = normalizeLibrary(raw);
  return visibleProducts(child).some((p) => p.id === id) ? [...new Set([...library, id])] : library;
}
export const STORE_LIBRARY_KEY = "waha:store:library:v1";
