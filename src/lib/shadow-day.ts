import { DEFAULT_CITY, type City } from "./cities.ts";
import { formatLocalHm, isVisibleHm } from "./clock.ts";
import { formatGregorian, formatHijri } from "./hijri.ts";
import { nextPrayerVisible, type PrayerKey } from "./prayer.ts";
import type { Lang } from "./i18n.ts";

export type ShadowDaySnapshot = {
  clock: string;
  hijri: string;
  gregorian: string;
  prayerKey: PrayerKey;
  prayerLabelAr: string;
  prayerLabelEn: string;
  prayerHm: string;
  cityAr: string;
  cityEn: string;
};

const FALLBACK_HIJRI = "اليوم الهجري";

function neverBlank(value: string, fallback: string): string {
  const trimmed = value?.trim?.() ?? "";
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed === "–") return fallback;
  return trimmed;
}

/** Sync snapshot — clock, next prayer, Hijri. Never empty. Weather is fetched separately. */
export function shadowDayNow(now = new Date(), city: City = DEFAULT_CITY): ShadowDaySnapshot {
  const clock = isVisibleHm(formatLocalHm(now)) ? formatLocalHm(now) : "00:00";
  const next = nextPrayerVisible(city.lat, city.lon, now, city.tz);
  const prayerHm = isVisibleHm(next.hm) ? next.hm : clock;
  const hijri = neverBlank(formatHijri(now, "ar", false), FALLBACK_HIJRI);
  const gregorian = neverBlank(formatGregorian(now, "ar"), clock);
  return {
    clock,
    hijri,
    gregorian,
    prayerKey: next.key,
    prayerLabelAr: neverBlank(next.label.ar, "الصلاة"),
    prayerLabelEn: neverBlank(next.label.en, "Prayer"),
    prayerHm,
    cityAr: city.ar || DEFAULT_CITY.ar,
    cityEn: city.en || DEFAULT_CITY.en,
  };
}

export function prayerLabel(snap: ShadowDaySnapshot, lang: Lang): string {
  return lang === "ar" ? snap.prayerLabelAr : snap.prayerLabelEn;
}
