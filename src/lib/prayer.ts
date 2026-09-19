import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from "adhan";
import { copy, loc, localeTag, type Copy, type Lang } from "@/lib/locale";

export const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_LABELS: Record<PrayerKey, Copy> = {
  fajr: copy("الفجر", "Fajr", "晨礼", "Fajr", "Fajr", "फज्र"),
  sunrise: copy("الشروق", "Sunrise", "日出", "Salida", "Lever", "सूर्योदय"),
  dhuhr: copy("الظهر", "Dhuhr", "晌礼", "Dhuhr", "Dhuhr", "ज़ुहर"),
  asr: copy("العصر", "Asr", "晡礼", "Asr", "Asr", "अस्र"),
  maghrib: copy("المغرب", "Maghrib", "昏礼", "Maghrib", "Maghrib", "मग़रिब"),
  isha: copy("العشاء", "Isha", "宵礼", "Isha", "Isha", "इशा"),
};

export function prayerLabel(key: PrayerKey, lang: Lang) {
  return loc(lang, PRAYER_LABELS[key]);
}

/** Calendar date in the city's timezone — so a UTC server still uses Riyadh's day. */
export function civilDateInZone(now: Date, tz: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const num = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return new Date(num("year"), num("month") - 1, num("day"), 12, 0, 0, 0);
}

export function getTimes(lat: number, lon: number, date = new Date(), tz = "Asia/Riyadh") {
  const coords = new Coordinates(lat, lon);
  const params = CalculationMethod.UmmAlQura();
  const civil = civilDateInZone(date, tz);
  return new PrayerTimes(coords, civil, params);
}

export function qiblaDeg(lat: number, lon: number) {
  return Qibla(new Coordinates(lat, lon));
}

export function timesMap(pt: PrayerTimes): Record<PrayerKey, Date> {
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

export function nextPrayer(
  pt: PrayerTimes,
  now = new Date(),
  tz = "Asia/Riyadh",
): { key: PrayerKey; at: Date } {
  const map = timesMap(pt);
  for (const key of PRAYER_KEYS) {
    if (map[key].getTime() > now.getTime()) return { key, at: map[key] };
  }
  const civil = civilDateInZone(now, tz);
  const nextCivil = new Date(civil);
  nextCivil.setDate(nextCivil.getDate() + 1);
  const next = new PrayerTimes(pt.coordinates, nextCivil, CalculationMethod.UmmAlQura());
  return { key: "fajr", at: next.fajr };
}

const NUM = { numberingSystem: "latn" as const };

/** Always Latin digits so Arabic display fonts cannot swallow the clock. */
export function formatHm(date: Date, lang: Lang, tz = "Asia/Riyadh") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "00:00";
  return new Intl.DateTimeFormat(localeTag(lang), {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    ...NUM,
  }).format(date);
}

export function formatClock(date: Date, lang: Lang, tz = "Asia/Riyadh") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "00:00";
  return new Intl.DateTimeFormat(localeTag(lang), {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    ...NUM,
  }).format(date);
}

export function formatDuration(ms: number, lang: Lang) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (lang === "ar") {
    if (h > 0) return `${h} س ${m} د`;
    return `${m} د ${s} ث`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export type ShadowPrayer = {
  key: PrayerKey;
  name: string;
  hm: string;
  remain: string;
  qibla: number;
  times: { key: PrayerKey; name: string; hm: string }[];
};

export function shadowPrayer(lat: number, lon: number, tz: string, lang: Lang, now = new Date()): ShadowPrayer {
  const pt = getTimes(lat, lon, now, tz);
  const next = nextPrayer(pt, now, tz);
  const map = timesMap(pt);
  return {
    key: next.key,
    name: prayerLabel(next.key, lang),
    hm: formatHm(next.at, lang, tz),
    remain: formatDuration(next.at.getTime() - now.getTime(), lang),
    qibla: Math.round(qiblaDeg(lat, lon)),
    times: PRAYER_KEYS.map((key) => ({
      key,
      name: prayerLabel(key, lang),
      hm: formatHm(map[key], lang, tz),
    })),
  };
}
