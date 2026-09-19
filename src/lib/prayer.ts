import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from "adhan";
import { civilDateInZone, formatHmInZone, formatLocalHm } from "./clock.ts";
import { DEFAULT_CITY } from "./cities.ts";

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

/** Umm al-Qura times for the civil day in `timeZone` (Riyadh default). */
export function getTimesInZone(lat: number, lon: number, now = new Date(), timeZone = DEFAULT_CITY.tz) {
  return getTimes(lat, lon, civilDateInZone(now, timeZone));
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

export function nextPrayer(pt: PrayerTimes, now = new Date(), timeZone = DEFAULT_CITY.tz): { key: PrayerKey; at: Date } {
  const map = timesMap(pt);
  for (const key of PRAYER_KEYS) {
    if (map[key].getTime() > now.getTime()) return { key, at: map[key] };
  }
  const todayCivil = civilDateInZone(now, timeZone);
  const tomorrowCivil = new Date(todayCivil);
  tomorrowCivil.setDate(tomorrowCivil.getDate() + 1);
  const next = getTimes(pt.coordinates.latitude, pt.coordinates.longitude, tomorrowCivil);
  return { key: "fajr", at: next.fajr };
}

/** Visible ASCII HH:MM. `lang` kept for callers; digits stay Latin so mono fonts never blank. */
export function formatHm(date: Date, _lang: "ar" | "en" = "ar", timeZone?: string) {
  if (timeZone) return formatHmInZone(date, timeZone);
  return formatLocalHm(date);
}

export type NextPrayerVisible = { key: PrayerKey; at: Date; hm: string; label: { ar: string; en: string } };

/** Next prayer that always has a visible HH:MM (Umm al-Qura, Riyadh coords/tz by default). */
export function nextPrayerVisible(
  lat = DEFAULT_CITY.lat,
  lon = DEFAULT_CITY.lon,
  now = new Date(),
  timeZone = DEFAULT_CITY.tz,
): NextPrayerVisible {
  try {
    const today = getTimesInZone(lat, lon, now, timeZone);
    const next = nextPrayer(today, now, timeZone);
    const hm = formatHmInZone(next.at, timeZone);
    return { key: next.key, at: next.at, hm, label: PRAYER_LABELS[next.key] };
  } catch {
    return { key: "dhuhr", at: now, hm: formatHmInZone(now, timeZone), label: PRAYER_LABELS.dhuhr };
  }
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
