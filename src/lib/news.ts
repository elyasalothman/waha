export type NewsItem = { id: string; title: string; href?: string };

/**
 * Home news is optional and must never throw into the page.
 * A failed or empty feed leaves «ظل اليوم» already painted.
 */
export async function fetchHomeNews(timeoutMs = 2500): Promise<NewsItem[]> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    if (typeof fetch !== "function") return [];
    // Isolated probe: if this (or a future feed) fails, home cards already painted.
    const res = await fetch("https://example.invalid/waha-news", { signal: ac.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: NewsItem[] };
    return Array.isArray(data.items) ? data.items.filter((row) => row?.title?.trim()) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
