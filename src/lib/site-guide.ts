import { LEAP_SERVICES } from "./leap-services.ts";
import { BOOK_CARDS } from "./books/seed.ts";
import { STORIES } from "./books/stories.ts";
import midad from "./books/platform/midad.json" with { type: "json" };
import { RESEARCH_LINKS } from "./research-catalog.ts";

export const SITE_GUIDE_NOTE = "من دليل واحة. الانتقال يتم عندما تضغط.";
export const SITE_GUIDE_NONE = "ما لقيت صفحة في واحة تناسب هذا الطلب.";

export type SiteMatch = { id: string; title: string; href: string; detail?: string };
export type SiteGuide =
  | { mode: "general" }
  | { mode: "none"; note: string }
  | { mode: "navigate"; note: string; matches: SiteMatch[] };

type Entry = {
  id: string;
  title: string;
  href: string;
  aliases: string[];
  detail?: string;
  money?: boolean;
};

const NAV =
  /وين|فين|ودني|وديني|وديي|ودي |ابي |ابغى|ابغا|خذني|افتح|ورني|دلني|اقرا/;

export function foldArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function internal(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && /^\/[a-z0-9/_-]*$/.test(href);
}

function trustedExternal(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return false;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "alhajda.com" || host.endsWith(".alhajda.com")) return true;
    return BOOK_CARDS.some((book) => book.url === href);
  } catch {
    return false;
  }
}

function entry(row: Entry): Entry | null {
  if (!(internal(row.href) || trustedExternal(row.href))) return null;
  const aliases = [...new Set(row.aliases.map(foldArabic).filter((alias) => alias.length >= 4))];
  if (!aliases.length) return null;
  return { ...row, aliases, detail: row.detail?.slice(0, 140) };
}

const PLACES: Entry[] = [
  {
    id: "books",
    title: "المكتبة",
    href: "/books",
    aliases: ["المكتبه", "رف الكتب", "رف كتبك", "اقرا كتاب", "اقر كتاب", "كتب الواحه"],
    detail: "القصص والكتب والرف داخل واحة",
  },
  {
    id: "alhajda-book",
    title: "كتاب الهجدة",
    href: "/books/alhajda",
    aliases: ["كتاب الهجده", "الهجده الكتاب"],
  },
  {
    id: "trading-guide",
    title: "دليل التداول",
    href: "/books/trading-guide",
    aliases: ["دليل التداول", "دليل المضاربه"],
  },
  {
    id: "mohsen",
    title: "محسن",
    href: "/mohsen",
    aliases: ["اسال محسن"],
  },
  { id: "quran", title: "القرآن", href: "/quran", aliases: ["القران", "المصحف", "الورد"] },
  { id: "news", title: "الأخبار", href: "/news", aliases: ["الاخبار", "اخر الاخبار"] },
  {
    id: "market-live",
    title: "البث المباشر",
    href: "/live",
    aliases: ["البث المباشر", "تلفزيون هدوء السوق"],
    detail: "تلفزيون هدوء السوق. الصوت لا يبدأ وحده، وصفحة السوق لا تُضمَّن",
  },
  { id: "games", title: "الألعاب", href: "/games", aliases: ["الالعاب"] },
  { id: "worship", title: "العبادة", href: "/worship", aliases: ["العباده", "تهجد", "مواقيت الصلاه"] },
  { id: "me", title: "الحساب", href: "/me", aliases: ["حسابي", "الحساب"] },
  { id: "settings", title: "الإعدادات", href: "/settings", aliases: ["الاعدادات"] },
  { id: "more", title: "المزيد", href: "/more", aliases: ["كل الخدمات", "المزيد"] },
  { id: "services", title: "خدمات الهجدة", href: "/services", aliases: ["خدمات الهجده"] },
  { id: "forum", title: "المجالس", href: "/forum", aliases: ["المجالس", "المنتدى"] },
  { id: "store", title: "المتجر", href: "/store", aliases: ["المتجر"] },
];

function buildRegistry(): Entry[] {
  const rows: Entry[] = [];
  const push = (row: Entry | null) => {
    if (!row || rows.some((item) => item.href === row.href)) return;
    rows.push(row);
  };
  for (const place of PLACES) push(entry(place));
  for (const paper of RESEARCH_LINKS) {
    push(
      entry({
        id: paper.id,
        title: paper.title,
        href: paper.href,
        aliases: [...paper.aliases],
        detail: paper.note,
      }),
    );
  }
  for (const service of LEAP_SERVICES) {
    push(
      entry({
        id: service.id,
        title: service.title,
        href: service.href,
        aliases: [service.title],
        money: service.group === "أخبار ومال",
      }),
    );
  }
  for (const book of BOOK_CARDS) {
    push(
      entry({
        id: book.id,
        title: book.titleAr,
        href: book.url,
        aliases: [book.titleAr],
        detail: book.benefitAr,
      }),
    );
  }
  for (const story of STORIES) {
    push(
      entry({
        id: `story-${story.slug}`,
        title: story.title,
        href: `/books/stories/${story.slug}`,
        aliases: [story.title],
        detail: story.subtitle,
      }),
    );
  }
  for (const book of midad) {
    push(
      entry({
        id: book.id,
        title: book.title,
        href: `/books/library/${book.id}`,
        aliases: [book.title],
        detail: `${book.author} · ${book.category}`,
      }),
    );
  }
  return rows;
}

export const SITE_REGISTRY: readonly Entry[] = buildRegistry();

const ALLOWED = new Set(SITE_REGISTRY.map((item) => item.href));

/** Exact allowlist. User text and model URLs are never accepted here. */
export function isAllowlistedHref(href: string): boolean {
  if (typeof href !== "string" || href.length > 400) return false;
  if (/[\s<>"'`\\]/.test(href)) return false;
  const lower = href.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || href.startsWith("//"))
    return false;
  return ALLOWED.has(href);
}

function score(query: string, item: Entry): number {
  let best = 0;
  for (const alias of item.aliases) {
    if (query.includes(alias)) best = Math.max(best, alias.length + (alias.includes(" ") ? 8 : 0));
  }
  return best;
}

const CONTENT =
  /فسر|اشرح|شرح|معنى|كيف|ليش|لماذا|كم|ما هو|ما هي|ماهي|وش |لخص|ترجم|قارن|احسب|تفسير/;

function aliasPattern(foldedAlias: string): RegExp {
  const body = [...foldedAlias]
    .map((ch) => {
      if (ch === "ا") return "[اأإآٱ]";
      if (ch === "ه") return "[هة]";
      if (ch === "ي") return "[يىئ]";
      if (ch === "و") return "[وؤ]";
      if (ch === " ") return "\\s+";
      return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(body, "gi");
}

/** Keep the visitor's leftover words, including × and digits. Place names are removed. */
function stripPlaceClause(clause: string, matches: readonly SiteMatch[]): string {
  let text = ` ${clause.trim().replace(/^و(?=\p{L})/u, "")} `;
  const aliases = matches
    .flatMap((match) => SITE_REGISTRY.find((item) => item.id === match.id)?.aliases ?? [])
    .sort((a, b) => b.length - a.length);
  for (const alias of aliases) text = text.replace(aliasPattern(alias), " ");
  text = text
    .replace(/javascript:\S*|https?:\/\/\S*|data:\S*/gi, " ")
    .replace(
      /(^|\s)(وين|فين|وديني|ودني|وديي|ودي|ابي|ابغى|ابغا|خذني|افتح|ورني|دلني|بالواحة|في الواحة)(?=\s|$)/g,
      " ",
    )
    .replace(/[?؟]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function clauseIsQuestion(text: string): boolean {
  const words = foldArabic(text)
    .split(" ")
    .filter((word) => word.length > 1 && !/^(في|من|الى|علي|عن|و|او|لي|لك|حق|بعد|ثم|لو|سمحت)$/.test(word));
  const joined = words.join(" ");
  if (!joined) return false;
  return CONTENT.test(joined) || words.length >= 3;
}

/** Words left after a place name is removed. A real question here is mixed intent. */
export function generalRemainder(query: string, matches: readonly SiteMatch[]): string {
  const clauses = query
    .split(/\s*[?؟]+\s*|\s+و\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const kept = (clauses.length ? clauses : [query])
    .map((clause) => stripPlaceClause(clause, matches))
    .filter(clauseIsQuestion);
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

const PLACE_PRONOUN = /فكرت[هة]|معناه|(^| )عنه( |$)|(^| )عنها( |$)|(^| )هذا( |$)|(^| )هذه( |$)/;

/** The remote service gets the leftover question, plus the place title only when a pronoun needs it. */
export function remoteQuestion(query: string, matches: readonly SiteMatch[]): string {
  const question = generalRemainder(query, matches);
  if (!question) return "";
  if (!PLACE_PRONOUN.test(foldArabic(question))) return question;
  const titles = [...new Set(matches.map((match) => match.title))].join("، ");
  return titles ? `${question}\nالسياق: ${titles}` : question;
}

export function localNavigationText(matches: readonly SiteMatch[]): string {
  const library = matches.some((match) => match.href === "/books");
  const research = matches.some((match) => match.id === "research");
  if (library && research) return "تبغى المكتبة ومركز الأبحاث؟ هذي وجهاتهم.";
  if (matches.length === 1) {
    const one = matches[0]!;
    if (one.href.startsWith("/books/") || one.href.includes("/research/"))
      return `«${one.title}» تلقاه من هنا.`;
    return `هذا مكان ${one.title}.`;
  }
  return "لقيت لك هالوجهات.";
}

export type GuideTurn =
  | { action: "remote" }
  | { action: "local"; text: string; guide: SiteGuide }
  | { action: "mixed"; localText: string; remoteMessage: string; guide: SiteGuide };

/**
 * Place questions are answered from the registry. The remote assistant is only
 * for a general question, or for the leftover question in a mixed request.
 * This does not change the remote service.
 */
export function planGuideTurn(query: string, options?: { hideMoney?: boolean }): GuideTurn {
  const guide = guideSite(query, options);
  if (guide.mode === "general") return { action: "remote" };
  if (guide.mode === "none") return { action: "local", text: guide.note, guide };
  const rest = remoteQuestion(query, guide.matches);
  const localText = localNavigationText(guide.matches);
  if (rest) return { action: "mixed", localText, remoteMessage: rest, guide };
  return { action: "local", text: localText, guide };
}

export function guideSite(query: string, options?: { hideMoney?: boolean }): SiteGuide {
  const folded = foldArabic(query).slice(0, 500);
  if (!folded) return { mode: "general" };
  const ranked = SITE_REGISTRY.filter((item) => !(options?.hideMoney && item.money))
    .map((item) => ({ item, score: score(folded, item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ar"));
  const matches: SiteMatch[] = [];
  for (const row of ranked) {
    if (!isAllowlistedHref(row.item.href) || matches.some((item) => item.href === row.item.href))
      continue;
    matches.push({
      id: row.item.id,
      title: row.item.title,
      href: row.item.href,
      detail: row.item.detail,
    });
    if (matches.length === 4) break;
  }
  if (matches.length) return { mode: "navigate", note: SITE_GUIDE_NOTE, matches };
  if (NAV.test(folded)) return { mode: "none", note: SITE_GUIDE_NONE };
  return { mode: "general" };
}
