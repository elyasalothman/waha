import type { Lang } from "@/lib/i18n";
import { HOUSE_SITES, type HouseSite } from "./house-sites.ts";

export const DDG_SEARCH = "https://duckduckgo.com/?q=";

export type OmniboxKind = "url" | "search";

export type OmniboxIntent = {
  kind: OmniboxKind;
  query: string;
  href?: string;
};

export { HOUSE_SITES, type HouseSite };

export type QuickTool = {
  id: string;
  ar: string;
  en: string;
  href: string;
  keywords: string[];
};

export const QUICK_TOOLS: QuickTool[] = [
  {
    id: "calc",
    ar: "حاسبة",
    en: "Calculator",
    href: "https://tools.alhajda.com/calc",
    keywords: ["حاسبة", "احسب", "حساب", "calc", "calculator"],
  },
  {
    id: "translate",
    ar: "ترجمة",
    en: "Translate",
    href: "https://tools.alhajda.com/",
    keywords: ["ترجمة", "ترجم", "معنى", "translate", "meaning"],
  },
];

const HOSTISH =
  /^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?::\d{1,5})?(?:[/?#].*)?$/i;

export function duckDuckGoUrl(query: string): string {
  return `${DDG_SEARCH}${encodeURIComponent(query)}`;
}

export function wikipediaSummaryUrl(query: string, lang: Lang): string {
  const wiki = lang === "ar" ? "ar" : "en";
  return `https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
}

export function wikipediaOpenUrl(query: string, lang: Lang): string {
  const wiki = lang === "ar" ? "ar" : "en";
  return `https://${wiki}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}

export function translateUrl(query: string, lang: Lang): string {
  const hint = lang === "ar" ? "ترجمة" : "translate";
  return duckDuckGoUrl(`${hint} ${query}`.trim());
}

function safeHttpUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * إن كان المدخل URL أو مضيفاً واضحاً → تصفّح.
 * وإلا → بحث (عربي ومسافات مسموحة).
 */
export function classifyOmnibox(raw: string): OmniboxIntent {
  const query = raw.trim();
  if (!query) return { kind: "search", query: "" };

  const asHttp = safeHttpUrl(query);
  if (asHttp) return { kind: "url", query, href: asHttp };

  if (!/\s/.test(query) && HOSTISH.test(query)) {
    const href = safeHttpUrl(`https://${query}`);
    if (href) return { kind: "url", query, href };
  }

  return { kind: "search", query };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchHouseSites(raw: string): HouseSite[] {
  const q = normalize(raw);
  if (!q) return [...HOUSE_SITES];
  const intent = classifyOmnibox(raw);
  if (intent.href) {
    try {
      const host = new URL(intent.href).host.replace(/^www\./, "");
      const byHost = HOUSE_SITES.filter((site) => host === site.host);
      if (byHost.length) return byHost;
    } catch {
      /* fall through */
    }
  }
  return HOUSE_SITES.filter((site) => {
    const hay = [
      site.id,
      site.title.ar,
      site.title.en,
      site.host,
      site.blurb.ar,
      site.blurb.en,
      ...site.keywords,
    ]
      .join("\n")
      .toLowerCase();
    return hay.includes(q) || q.includes(normalize(site.title.ar)) || q.includes(normalize(site.title.en));
  });
}

export function matchQuickTools(raw: string): QuickTool[] {
  const q = normalize(raw);
  if (!q) return QUICK_TOOLS;
  return QUICK_TOOLS.filter((tool) => {
    const hay = [tool.id, tool.ar, tool.en, ...tool.keywords].join("\n").toLowerCase();
    return hay.includes(q) || tool.keywords.some((k) => q.includes(normalize(k)));
  });
}

export function looksLikeCalc(raw: string): boolean {
  const q = raw.trim();
  if (!q) return false;
  if (/^(احسب|حاسبة|calc)(?:\s|$)/i.test(q)) return true;
  return /^[\d\s+\-*/().×÷−^%,.]+$/.test(q) && /\d/.test(q);
}

export type MadarVisit = {
  title: string;
  query: string;
  href?: string;
  kind: OmniboxKind | "house";
  at: number;
};

export const MADAR_HISTORY_KEY = "waha:madar:history";
export const MADAR_FAVORITES_KEY = "waha:madar:favorites";
export const MADAR_HISTORY_LIMIT = 12;
export const MADAR_FAVORITES_LIMIT = 6;

export function pushVisit(list: MadarVisit[], visit: MadarVisit): MadarVisit[] {
  const key = visit.href ?? visit.query;
  return [visit, ...list.filter((item) => (item.href ?? item.query) !== key)].slice(0, MADAR_HISTORY_LIMIT);
}

export function toggleFavorite(list: MadarVisit[], item: MadarVisit): MadarVisit[] {
  const key = item.href ?? item.query;
  const exists = list.some((fav) => (fav.href ?? fav.query) === key);
  if (exists) return list.filter((fav) => (fav.href ?? fav.query) !== key);
  return [item, ...list].slice(0, MADAR_FAVORITES_LIMIT);
}

export function isFavorite(list: MadarVisit[], item: Pick<MadarVisit, "href" | "query">): boolean {
  const key = item.href ?? item.query;
  return list.some((fav) => (fav.href ?? fav.query) === key);
}
