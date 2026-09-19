import { DEFAULT_CITY, type City } from "./cities.ts";
import { formatLocalHm, isVisibleHm } from "./clock.ts";
import { formatGregorian, formatHijri } from "./hijri.ts";
import { nextPrayerVisible, type PrayerKey } from "./prayer.ts";
import { climateFallbackC, formatCelsius, readWeatherCache, weatherLabel } from "./weather.ts";
import type { Lang } from "./i18n.ts";

export type ShadowDaySnapshot = {
  clock: string;
  hijri: string;
  gregorian: string;
  prayerKey: PrayerKey;
  prayerLabelAr: string;
  prayerLabelEn: string;
  prayerHm: string;
  weatherText: string;
  weatherC: number;
  weatherLabelAr: string;
  weatherLabelEn: string;
  cityAr: string;
  cityEn: string;
};

const FALLBACK_HIJRI = "اليوم الهجري";

function neverBlank(value: string, fallback: string): string {
  const trimmed = value?.trim?.() ?? "";
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed === "–") return fallback;
  return trimmed;
}

/** Instant °C: cache if present, else Riyadh-month climate. Never empty, never waits. */
export function instantWeatherC(lat: number, lon: number): { celsius: number; text: string; code: number } {
  const cached = readWeatherCache(lat, lon);
  if (cached && Number.isFinite(cached.current.temperature)) {
    return {
      celsius: cached.current.temperature,
      text: formatCelsius(cached.current.temperature),
      code: cached.current.code,
    };
  }
  const celsius = climateFallbackC();
  return { celsius, text: formatCelsius(celsius), code: 1 };
}

/** Sync snapshot — clock, next prayer, weather °C, Hijri. Numbers on first paint. */
export function shadowDayNow(now = new Date(), city: City = DEFAULT_CITY): ShadowDaySnapshot {
  const clock = isVisibleHm(formatLocalHm(now)) ? formatLocalHm(now) : "00:00";
  const next = nextPrayerVisible(city.lat, city.lon, now, city.tz);
  const prayerHm = isVisibleHm(next.hm) ? next.hm : clock;
  const hijri = neverBlank(formatHijri(now, "ar", false), FALLBACK_HIJRI);
  const gregorian = neverBlank(formatGregorian(now, "ar"), clock);
  const wx = instantWeatherC(city.lat, city.lon);
  return {
    clock,
    hijri,
    gregorian,
    prayerKey: next.key,
    prayerLabelAr: neverBlank(next.label.ar, "الصلاة"),
    prayerLabelEn: neverBlank(next.label.en, "Prayer"),
    prayerHm,
    weatherText: neverBlank(wx.text, formatCelsius(climateFallbackC())),
    weatherC: wx.celsius,
    weatherLabelAr: weatherLabel(wx.code, "ar"),
    weatherLabelEn: weatherLabel(wx.code, "en"),
    cityAr: city.ar || DEFAULT_CITY.ar,
    cityEn: city.en || DEFAULT_CITY.en,
  };
}

export function prayerLabel(snap: ShadowDaySnapshot, lang: Lang): string {
  return lang === "ar" ? snap.prayerLabelAr : snap.prayerLabelEn;
}
