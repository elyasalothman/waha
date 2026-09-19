import { create } from "zustand";
import { CITIES, DEFAULT_CITY, type City, findCity } from "@/lib/cities";
import type { Audience } from "@/lib/catalog";
import { parseChildSegment, type ChildSegment } from "@/lib/child-mode";
import type { Lang } from "@/lib/i18n";

type AppState = {
  lang: Lang;
  audience: Audience;
  segment: ChildSegment;
  city: City;
  recent: string[];
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setAudience: (audience: Audience) => void;
  setSegment: (segment: ChildSegment) => void;
  setCity: (id: string) => void;
  setCityCoords: (lat: number, lon: number, labelAr: string, labelEn: string) => void;
  pushRecent: (id: string) => void;
  hydrate: () => void;
};

const KEY = "waha:prefs";

function persist(partial: Pick<AppState, "lang" | "city" | "recent" | "audience" | "segment">) {
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
      }),
    );
  } catch {
    /* ignore */
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  lang: "ar",
  audience: "personal",
  segment: "all",
  city: DEFAULT_CITY,
  recent: [],
  setLang: (lang) => {
    set({ lang });
    persist(get());
  },
  toggleLang: () => {
    set({ lang: get().lang === "ar" ? "en" : "ar" });
    persist(get());
  },
  setAudience: (audience) => {
    set({ audience, segment: audience === "work" ? "all" : get().segment });
    persist(get());
  },
  setSegment: (segment) => {
    set({
      segment,
      audience: segment === "child" || segment === "family" ? "personal" : get().audience === "work" ? "work" : "personal",
    });
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
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        lang?: Lang;
        cityId?: string;
        recent?: string[];
        city?: City;
        audience?: Audience;
        segment?: unknown;
      };
      const city =
        parsed.city?.id === "geo" && parsed.city
          ? parsed.city
          : parsed.cityId
            ? (CITIES.find((c) => c.id === parsed.cityId) ?? DEFAULT_CITY)
            : DEFAULT_CITY;
      const segment = parseChildSegment(parsed.segment);
      set({
        lang: parsed.lang === "en" ? "en" : "ar",
        audience:
          segment === "child" || segment === "family"
            ? "personal"
            : parsed.audience === "work"
              ? "work"
              : "personal",
        segment,
        city,
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      });
    } catch {
      /* ignore */
    }
  },
}));
