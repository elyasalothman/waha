import { parseScienceFeed, type BriefingResponse } from "../../../src/lib/news-feed.ts";

// Fixed public RSS endpoint; no user-supplied URLs, credentials, or personal data.
const FEED_URL = "https://www.sciencedaily.com/rss/top/science.xml";
const FRESH_MS = 10 * 60 * 1000;
const STALE_MS = 60 * 60 * 1000;
let cached: { at: number; data: BriefingResponse } | null = null;
let inFlight: Promise<BriefingResponse> | null = null;

async function loadFeed(): Promise<BriefingResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(FEED_URL, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!response.ok || !response.body) throw new Error("Feed unavailable");
    if (Number(response.headers.get("content-length") || 0) > 1_000_000)
      throw new Error("Oversized feed");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let xml = "";
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1_000_000) {
        await reader.cancel();
        throw new Error("Oversized feed");
      }
      xml += decoder.decode(chunk.value, { stream: true });
    }
    xml += decoder.decode();
    const now = new Date();
    const items = parseScienceFeed(xml, now);
    if (!items.length) throw new Error("No recent dated articles");
    const data: BriefingResponse = { items, fetchedAt: now.toISOString(), status: "live" };
    cached = { at: now.getTime(), data };
    return data;
  } catch {
    if (cached && Date.now() - cached.at < STALE_MS) {
      const items = cached.data.items.filter(
        (item) => Date.now() - Date.parse(item.publishedAt) <= 72 * 60 * 60 * 1000,
      );
      if (items.length) return { ...cached.data, items, status: "cached" };
    }
    return { items: [], fetchedAt: null, status: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function newsFeed() {
  // RSS availability is not a redistribution license. Enable only after rights review.
  if (process.env.WAHA_ENABLE_SCIENCE_RSS !== "true") {
    return Response.json(
      { items: [], fetchedAt: null, status: "disabled" } satisfies BriefingResponse,
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  let data: BriefingResponse;
  if (cached && Date.now() - cached.at < FRESH_MS) data = { ...cached.data, status: "cached" };
  else {
    inFlight ??= loadFeed().finally(() => {
      inFlight = null;
    });
    data = await inFlight;
  }
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" },
  });
}
