import type { BriefingItem } from "./news-feed.ts";
export const NEWS_SOURCES = [
  {
    name: "BBC عربي",
    url: "https://feeds.bbci.co.uk/arabic/rss.xml",
    hosts: ["www.bbc.com", "www.bbc.co.uk", "bbc.com"],
  },
  {
    name: "الجزيرة",
    url: "https://www.aljazeera.net/aljazeerarss/arabi",
    hosts: ["www.aljazeera.net", "aljazeera.net"],
  },
  {
    name: "الشرق",
    url: "https://asharq.com/rss.xml",
    hosts: ["asharq.com", "www.asharq.com", "asharqbusiness.com", "www.asharqbusiness.com"],
  },
] as const;
export const NEWS_TOPICS = ["الكل", "السعودية", "العالم", "اقتصاد", "تقنية", "رياضة"] as const;
export type ArabicNews = {
  items: BriefingItem[];
  fetchedAt: string | null;
  status: "live" | "cached" | "unavailable";
  sources: { name: string; ok: boolean }[];
  bulletin: { text: string; updatedAt: string; mode: "extractive"; items: BriefingItem[] } | null;
};
function plain(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => {
      const v = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return v > 0 && v <= 0x10ffff ? String.fromCodePoint(v) : "";
    })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
export function newsTopic(text: string) {
  if (/رياض|كرة|مباراة|دوري|منتخب|نادي/.test(text)) return "رياضة";
  if (/تقنية|تكنولوجيا|ذكاء اصطناعي|إلكتروني|برمج|آيفون/.test(text)) return "تقنية";
  if (/اقتصاد|نفط|أسهم|بورصة|تجارة|بنك|دولار|استثمار/.test(text)) return "اقتصاد";
  if (/السعودية|سعودي|الرياض|ولي العهد|الحرمين/.test(text)) return "السعودية";
  return "العالم";
}
export function parseArabicFeed(
  xml: string,
  source: (typeof NEWS_SOURCES)[number],
  now = Date.now(),
): BriefingItem[] {
  if (xml.length > 1_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) return [];
  const items: BriefingItem[] = [];
  const seen = new Set<string>();
  for (const item of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const read = (tag: string) =>
      plain(item[1].match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
    const title = read("title"),
      href = read("link"),
      date = Date.parse(read("pubDate"));
    if (
      !title ||
      title.length > 300 ||
      !Number.isFinite(date) ||
      now - date > 72 * 3600000 ||
      date - now > 300000
    )
      continue;
    try {
      const u = new URL(href);
      if (
        u.protocol !== "https:" ||
        !(source.hosts as readonly string[]).includes(u.hostname) ||
        u.username ||
        u.password ||
        seen.has(href)
      )
        continue;
    } catch {
      continue;
    }
    seen.add(href);
    items.push({
      id: href,
      title,
      href,
      source: source.name,
      publishedAt: new Date(date).toISOString(),
      topic: newsTopic(title + " " + read("category")),
    });
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 30);
}
export function makeBulletin(items: BriefingItem[], updatedAt: string) {
  const selected: BriefingItem[] = [];
  const titles = new Set<string>();
  for (const item of items) {
    if (titles.has(item.title)) continue;
    selected.push(item);
    titles.add(item.title);
    if (selected.length === 6) break;
  }
  return {
    mode: "extractive" as const,
    updatedAt,
    items: selected,
    text:
      "أهلًا بكم في موجز واحة. إليكم أبرز العناوين من مصادرها. " +
      selected.map((i) => `من ${i.source}: ${i.title}.`).join(" ") +
      " كانت هذه عناوين الموجز الآلي. راجعوا المصادر للتفاصيل والتحديثات.",
  };
}
