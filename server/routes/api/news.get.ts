import {
  NEWS_SOURCES,
  parseArabicFeed,
  makeBulletin,
  type ArabicNews,
} from "../../../src/lib/arabic-news.ts";
const TTL = 600_000;
let cache: { at: number; data: ArabicNews } | null = null;
let inFlight: Promise<ArabicNews> | null = null;
let bulletin: ArabicNews["bulletin"] = null;
async function load(): Promise<ArabicNews> {
  const now = Date.now();
  const feeds = await Promise.all(
    NEWS_SOURCES.map(async (source) => {
      try {
        const r = await fetch(source.url, {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/rss+xml, application/xml" },
        });
        if (!r.ok || !r.body) throw new Error("unavailable");
        const reader = r.body.getReader();
        let bytes = 0;
        const chunks: Uint8Array[] = [];
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > 1_000_000) {
            await reader.cancel();
            throw new Error("large");
          }
          chunks.push(chunk.value);
        }
        const joined = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) {
          joined.set(chunk, offset);
          offset += chunk.byteLength;
        }
        const items = parseArabicFeed(new TextDecoder().decode(joined), source, now);
        return { name: source.name, ok: items.length > 0, items };
      } catch {
        return { name: source.name, ok: false, items: [] };
      }
    }),
  );
  const items = [...new Map(feeds.flatMap((f) => f.items).map((i) => [i.href, i])).values()].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  );
  if (!items.length) {
    if (cache && now - cache.at < 3600000)
      return {
        ...cache.data,
        status: "cached",
        sources: feeds.map(({ name, ok }) => ({ name, ok })),
      };
    return {
      items: [],
      fetchedAt: null,
      status: "unavailable",
      sources: feeds.map(({ name, ok }) => ({ name, ok })),
      bulletin: null,
    };
  }
  if (!bulletin || now - Date.parse(bulletin.updatedAt) >= 3600000)
    bulletin = makeBulletin(items, new Date(now).toISOString());
  const data: ArabicNews = {
    items,
    fetchedAt: new Date(now).toISOString(),
    status: "live",
    sources: feeds.map(({ name, ok }) => ({ name, ok })),
    bulletin,
  };
  cache = { at: now, data };
  return data;
}
export default async function newsFeed() {
  let data: ArabicNews;
  if (cache && Date.now() - cache.at < TTL) data = { ...cache.data, status: "cached" };
  else {
    inFlight ??= load().finally(() => {
      inFlight = null;
    });
    data = await inFlight;
  }
  return Response.json(data, {
    headers: {
      "Cache-Control":
        data.status === "unavailable" ? "no-store" : "public, max-age=60, s-maxage=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
