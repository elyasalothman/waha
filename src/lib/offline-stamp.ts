import { localeTag, type Lang } from "@/lib/locale";
import type { Ayah } from "@/lib/daily";
import type { PrayerKey } from "@/lib/prayer";
import type { WeatherPayload } from "@/lib/weather";

export type OfflineStamp = {
  at: number;
  cityId: string;
  weather: WeatherPayload | null;
  prayer: {
    nextKey: PrayerKey;
    nextHm: string;
    times: { key: PrayerKey; name: string; hm: string }[];
  } | null;
  ayah: Ayah | null;
};

const KEY = "waha:offline-stamp";

export function writeOfflineStamp(stamp: OfflineStamp) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(stamp));
  } catch {
    /* quota */
  }
}

export function readOfflineStamp(): OfflineStamp | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineStamp;
    if (!parsed || typeof parsed.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Latin clock so Arabic display fonts cannot swallow the stamp. */
export function formatStampClock(at: number, lang: Lang, tz = "Asia/Riyadh") {
  if (!at || Number.isNaN(at)) {
    return new Intl.DateTimeFormat(localeTag(lang), {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      numberingSystem: "latn",
    }).format(new Date());
  }
  return new Intl.DateTimeFormat(localeTag(lang), {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(new Date(at));
}
