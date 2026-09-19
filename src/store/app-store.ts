import { create } from "zustand";
import { CITIES, DEFAULT_CITY, type City, findCity } from "@/lib/cities";
import type { Audience } from "@/lib/catalog";
import { parseLang, type Lang } from "@/lib/locale";
import { audienceFor, parseSegment, type Segment } from "@/lib/segments";
import {
  applyChrome,
  parseLabs,
  parseMode,
  parseTheme,
  type FontScale,
  type LabId,
  type Mode,
  type ThemeId,
} from "@/lib/themes";

type AppState = {
  lang: Lang;
  audience: Audience;
  segment: Segment;
  theme: ThemeId;
  mode: Mode;
  fontScale: FontScale;
  reduceMotion: boolean;
  displayName: string;
  labs: LabId[];
  city: City;
  recent: string[];
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setAudience: (audience: Audience) => void;
  setSegment: (segment: Segment) => void;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: Mode) => void;
  setFontScale: (fontScale: FontScale) => void;
  setReduceMotion: (v: boolean) => void;
  setDisplayName: (name: string) => void;
  toggleLab: (id: LabId) => void;
  setCity: (id: string) => void;
  setCityCoords: (lat: number, lon: number, labelAr: string, labelEn: string) => void;
  pushRecent: (id: string) => void;
  hydrate: () => void;
};

const KEY = "waha:prefs";

type PersistShape = Pick<
  AppState,
  | "lang"
  | "city"
  | "recent"
  | "audience"
  | "segment"
  | "theme"
  | "mode"
  | "fontScale"
  | "reduceMotion"
  | "displayName"
  | "labs"
>;

function persist(partial: PersistShape) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        lang: partial.lang,
        cityId: partial.city.id,
        recent: partial.recent,
        city: partial.city,
        audience: partial.audience,
        segment: partial.segment,
        theme: partial.theme,
        mode: partial.mode,
        fontScale: partial.fontScale,
        reduceMotion: partial.reduceMotion,
        displayName: partial.displayName,
        labs: partial.labs,
      }),
    );
  } catch {
    /* ignore */
  }
}

function paint(s: PersistShape) {
  applyChrome({
    lang: s.lang,
    theme: s.theme,
    mode: s.mode,
    scale: s.segment === "elder" || s.segment === "child" ? "lg" : s.fontScale,
    reduceMotion: s.reduceMotion,
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  lang: "ar",
  audience: "personal",
  segment: "all",
  theme: "oasis",
  mode: "dark",
  fontScale: "md",
  reduceMotion: false,
  displayName: "",
  labs: [],
  city: DEFAULT_CITY,
  recent: [],
  setLang: (lang) => {
    set({ lang });
    persist(get());
    paint(get());
  },
  toggleLang: () => {
    set({ lang: get().lang === "ar" ? "en" : "ar" });
    persist(get());
    paint(get());
  },
  setAudience: (audience) => {
    set({ audience, segment: audience === "work" ? "work" : get().segment === "work" ? "all" : get().segment });
    persist(get());
    paint(get());
  },
  setSegment: (segment) => {
    set({ segment, audience: audienceFor(segment), fontScale: segment === "elder" || segment === "child" ? "lg" : get().fontScale });
    persist(get());
    paint(get());
  },
  setTheme: (theme) => {
    set({ theme });
    persist(get());
    paint(get());
  },
  setMode: (mode) => {
    set({ mode });
    persist(get());
    paint(get());
  },
  setFontScale: (fontScale) => {
    set({ fontScale });
    persist(get());
    paint(get());
  },
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
    persist(get());
    paint(get());
  },
  setDisplayName: (displayName) => {
    set({ displayName });
    persist(get());
  },
  toggleLab: (id) => {
    const labs = get().labs.includes(id) ? get().labs.filter((x) => x !== id) : [...get().labs, id];
    set({ labs });
    persist(get());
  },
  setCity: (id) => {
    set({ city: findCity(id) });
    persist(get());
  },
  setCityCoords: (lat, lon, labelAr, labelEn) => {
    const city: City = {
      id: "geo",
      ar: labelAr,
      en: labelEn,
      lat,
      lon,
      tz: DEFAULT_CITY.tz,
      countryAr: "",
      countryEn: "",
    };
    set({ city });
    persist(get());
  },
  pushRecent: (id) => {
    const recent = [id, ...get().recent.filter((x) => x !== id)].slice(0, 8);
    set({ recent });
    persist(get());
  },
  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        paint(get());
        return;
      }
      const parsed = JSON.parse(raw) as {
        lang?: Lang;
        cityId?: string;
        recent?: string[];
        city?: City;
        audience?: Audience;
        segment?: Segment;
        theme?: ThemeId;
        mode?: Mode;
        fontScale?: FontScale;
        reduceMotion?: boolean;
        displayName?: string;
        labs?: LabId[];
      };
      const city =
        parsed.city?.id === "geo" && parsed.city
          ? parsed.city
          : parsed.cityId
            ? (CITIES.find((c) => c.id === parsed.cityId) ?? DEFAULT_CITY)
            : DEFAULT_CITY;
      const segment = parseSegment(parsed.segment ?? (parsed.audience === "work" ? "work" : "all"));
      set({
        lang: parseLang(parsed.lang),
        audience: audienceFor(segment),
        segment,
        theme: parseTheme(parsed.theme),
        mode: parseMode(parsed.mode),
        fontScale: parsed.fontScale === "lg" ? "lg" : "md",
        reduceMotion: Boolean(parsed.reduceMotion),
        displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
        labs: parseLabs(parsed.labs),
        city,
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      });
      paint(get());
    } catch {
      paint(get());
    }
  },
}));
