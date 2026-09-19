export type NewsItem = { id: string; title: string; href?: string };

/**
 * Home news is optional and must never throw into the page.
 * A failed or empty feed leaves «ظل اليوم» already painted.
 */
export async function fetchHomeNews(timeoutMs = 2500): Promise<NewsItem[]> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const res = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/ar/onthisday/all/${mm}/${dd}`, {
      signal: ac.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { selected?: { text?: string }[] };
    const items = (data.selected ?? [])
      .map((row, i) => ({ id: `n-${i}`, title: (row.text ?? "").trim() }))
      .filter((row) => row.title.length > 0)
      .slice(0, 3);
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
