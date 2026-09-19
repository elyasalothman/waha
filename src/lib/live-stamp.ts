export const LIVE_STAMP_KEY = "waha:live-stamp";

export type LiveSource = "weather" | "prayer";

export type LiveStamp = Partial<Record<LiveSource, number>>;

export function readLiveStamp(storage: Pick<Storage, "getItem"> | null | undefined): LiveStamp {
  if (!storage) return {};
  try {
    const raw = storage.getItem(LIVE_STAMP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LiveStamp;
    return {
      weather: typeof parsed.weather === "number" ? parsed.weather : undefined,
      prayer: typeof parsed.prayer === "number" ? parsed.prayer : undefined,
    };
  } catch {
    return {};
  }
}

export function markLiveFetch(
  source: LiveSource,
  at: number,
  storage: Pick<Storage, "getItem" | "setItem"> | null | undefined,
): LiveStamp {
  const next = { ...readLiveStamp(storage), [source]: at };
  if (!storage) return next;
  try {
    storage.setItem(LIVE_STAMP_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function lastSuccessfulFetch(stamp: LiveStamp): number | null {
  const times = [stamp.weather, stamp.prayer].filter((n): n is number => typeof n === "number");
  return times.length ? Math.max(...times) : null;
}

export function formatLiveStamp(at: number, lang: "ar" | "en", now = Date.now()): string {
  const delta = Math.max(0, now - at);
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return lang === "ar" ? "الآن" : "just now";
  if (minutes < 60) {
    return lang === "ar" ? `قبل ${minutes} د` : `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === "ar" ? `قبل ${hours} س` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return lang === "ar" ? `قبل ${days} يوم` : `${days}d ago`;
}
