import { create } from "zustand";
import { CITIES, DEFAULT_CITY, type City, findCity } from "@/lib/cities";
import type { Audience } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

type AppState = {
  lang: Lang;
  audience: Audience;
  city: City;
  recent: string[];
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setAudience: (audience: Audience) => void;
  setCity: (id: string) => void;
  setCityCoords: (lat: number, lon: number, labelAr: string, labelEn: string) => void;
  pushRecent: (id: string) => void;
  hydrate: () => void;
};

const KEY = "waha:prefs";

function persist(partial: Pick<AppState, "lang" | "city" | "recent" | "audience">) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        lang: partial.lang,
        cityId: partial.city.id,
        recent: partial.recent,
        city: partial.city,
        audience: partial.audience,
      }),
    );
  } catch {
    /* ignore */
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  lang: "ar",
  audience: "personal",
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
    set({ audience });
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
      };
      const city =
        parsed.city?.id === "geo" && parsed.city
          ? parsed.city
          : parsed.cityId
            ? (CITIES.find((c) => c.id === parsed.cityId) ?? DEFAULT_CITY)
            : DEFAULT_CITY;
      set({
        lang: parsed.lang === "en" ? "en" : "ar",
        audience: parsed.audience === "work" ? "work" : "personal",
        city,
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      });
    } catch {
      /* ignore */
    }
  },
}));
