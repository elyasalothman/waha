/** Hudoo opinions from the public JSON at news.alhajda.com. Fields are copied, not rewritten. */
export type AnalystCard = {
  handle: string;
  name: string;
  ini: string;
  color: string;
  role?: string;
  url?: string;
};

export type AnalystOpinion = {
  id: number;
  title: string;
  summary: string;
  url: string;
  postedAt: string;
  publishedAt: string | null;
  analyst: AnalystCard;
};

const HTTPS = /^https:\/\/[^\s]+$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function https(value: unknown): string {
  const url = text(value, 500);
  if (!HTTPS.test(url)) return "";
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function stamp(value: unknown): string | null {
  const raw = text(value, 40);
  const time = Date.parse(raw);
  if (!raw || !Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

function analyst(value: unknown): AnalystCard | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name = text(row.name, 80);
  const handle = text(row.handle, 40);
  if (!name || !handle) return null;
  const color = text(row.color, 7);
  return {
    handle,
    name,
    ini: text(row.ini, 4) || name.slice(0, 2),
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#0f766e",
    role: text(row.role, 120) || undefined,
    url: https(row.url) || undefined,
  };
}

/** Newest source post first. Duplicate ids keep the first copy. Invalid rows are dropped. */
export function parseAnalystFeed(payload: unknown): AnalystOpinion[] {
  const items =
    payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : [];
  const seen = new Set<number>();
  const opinions: AnalystOpinion[] = [];
  for (const value of items) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const id = row.id;
    const person = analyst(row.analyst);
    const postedAt = stamp(row.posted_at);
    const url = https(row.url);
    const title = text(row.title, 300);
    if (typeof id !== "number" || !Number.isInteger(id) || seen.has(id) || !person || !postedAt || !url || !title)
      continue;
    seen.add(id);
    opinions.push({
      id,
      title,
      summary: text(row.summary, 800),
      url,
      postedAt,
      publishedAt: stamp(row.published_at),
      analyst: person,
    });
  }
  return opinions.sort((a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : b.id - a.id));
}

/** Accept either Hudoo's posted_at rows or the already checked Waha payload. */
export function readAnalystPayload(payload: unknown): AnalystOpinion[] {
  const items =
    payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : [];
  const rows = items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (rows.some((item) => typeof item.postedAt === "string")) {
    return parseAnalystFeed({
      items: rows.map((item) => ({
        id: item.id,
        url: item.url,
        posted_at: item.postedAt,
        published_at: item.publishedAt,
        title: item.title,
        summary: item.summary,
        analyst: item.analyst,
      })),
    });
  }
  return parseAnalystFeed(payload);
}

/** A failed refresh keeps the last good list. A successful list replaces it, even if shorter. */
export function nextAnalystList(
  previous: readonly AnalystOpinion[],
  incoming: readonly AnalystOpinion[] | null,
): AnalystOpinion[] {
  if (!incoming) return [...previous];
  return [...incoming];
}
