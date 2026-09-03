import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from "adhan";

export const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_LABELS: Record<PrayerKey, { ar: string; en: string }> = {
  fajr: { ar: "الفجر", en: "Fajr" },
  sunrise: { ar: "الشروق", en: "Sunrise" },
  dhuhr: { ar: "الظهر", en: "Dhuhr" },
  asr: { ar: "العصر", en: "Asr" },
  maghrib: { ar: "المغرب", en: "Maghrib" },
  isha: { ar: "العشاء", en: "Isha" },
};

export function getTimes(lat: number, lon: number, date = new Date()) {
  const coords = new Coordinates(lat, lon);
  const params = CalculationMethod.UmmAlQura();
  return new PrayerTimes(coords, date, params);
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

export function nextPrayer(pt: PrayerTimes, now = new Date()): { key: PrayerKey; at: Date } {
  const map = timesMap(pt);
  for (const key of PRAYER_KEYS) {
    if (map[key].getTime() > now.getTime()) return { key, at: map[key] };
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = getTimes(pt.coordinates.latitude, pt.coordinates.longitude, tomorrow);
  return { key: "fajr", at: next.fajr };
}

export function formatHm(date: Date, lang: "ar" | "en") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDuration(ms: number, lang: "ar" | "en") {
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
