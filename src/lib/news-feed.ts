export type BriefingItem = {
  id: string;
  title: string;
  href: string;
  publishedAt: string;
  source: string;
  topic: string;
};
export type BriefingResponse = {
  items: BriefingItem[];
  fetchedAt: string | null;
  status: "live" | "cached" | "unavailable" | "disabled";
};

function plain(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, entity: string) => {
      const n =
        entity[0].toLowerCase() === "x" ? parseInt(entity.slice(1), 16) : parseInt(entity, 10);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Only dated article permalinks from the fixed publisher qualify; no XML execution. */
export function parseScienceFeed(xml: string, now = new Date()): BriefingItem[] {
  if (xml.length > 1_000_000) return [];
  const seen = new Set<string>();
  const items: BriefingItem[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const read = (name: string) =>
      plain(
        match[1].match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] ?? "",
      );
    const title = read("title");
    const href = read("link");
    const date = new Date(read("pubDate"));
    const age = now.getTime() - date.getTime();
    if (
      !title ||
      title.length > 300 ||
      !Number.isFinite(age) ||
      age < -300_000 ||
      age > 72 * 60 * 60 * 1000
    )
      continue;
    try {
      const url = new URL(href);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "www.sciencedaily.com" ||
        !/^\/releases\/[\d/]+[^/]+\.htm$/.test(url.pathname) ||
        url.username ||
        url.password ||
        url.search
      )
        continue;
    } catch {
      continue;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    items.push({
      id: href,
      title,
      href,
      publishedAt: date.toISOString(),
      source: "ScienceDaily",
      topic: "science",
    });
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 6);
}

/** Home may show one verified recent article, never disabled, malformed or archive data. */
export function selectHomeHeadline(
  feed: BriefingResponse | null,
  now = Date.now(),
): BriefingItem | null {
  if (!feed || !["live", "cached"].includes(feed.status) || !Array.isArray(feed.items)) return null;
  const fetchedAge = now - Date.parse(feed.fetchedAt ?? "");
  if (!Number.isFinite(fetchedAge) || fetchedAge < -300_000 || fetchedAge > 60 * 60 * 1000)
    return null;
  const valid = feed.items.filter((item) => {
    if (
      !item ||
      typeof item.title !== "string" ||
      !item.title.trim() ||
      item.title.length > 300 ||
      item.source !== "ScienceDaily"
    )
      return false;
    const age = now - Date.parse(item.publishedAt);
    if (!Number.isFinite(age) || age < -300_000 || age > 72 * 60 * 60 * 1000) return false;
    try {
      const url = new URL(item.href);
      return (
        url.protocol === "https:" &&
        url.hostname === "www.sciencedaily.com" &&
        /^\/releases\/[\d/]+[^/]+\.htm$/.test(url.pathname) &&
        !url.username &&
        !url.password &&
        !url.search
      );
    } catch {
      return false;
    }
  });
  return valid.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0] ?? null;
}
