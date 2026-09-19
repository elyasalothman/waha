import { create } from "zustand";
import { CITIES, DEFAULT_CITY, type City, findCity } from "@/lib/cities";
import type { Audience } from "@/lib/catalog";
import type { FeatureId, FeatureMap } from "@/lib/features";
import { defaultFeatures, normalizeFeatures } from "@/lib/features";
import type { Lang } from "@/lib/i18n";

type AppState = {
  lang: Lang;
  audience: Audience;
  city: City;
  recent: string[];
  profileName: string;
  guest: boolean;
  features: FeatureMap;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setAudience: (audience: Audience) => void;
  setCity: (id: string) => void;
  setCityCoords: (lat: number, lon: number, labelAr: string, labelEn: string) => void;
  setProfileName: (name: string) => void;
  setGuest: (guest: boolean) => void;
  setFeature: (id: FeatureId, on: boolean) => void;
  pushRecent: (id: string) => void;
  hydrate: () => void;
};

const KEY = "waha:prefs";

function persist(partial: Pick<AppState, "lang" | "city" | "recent" | "audience" | "profileName" | "guest" | "features">) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        lang: partial.lang,
        cityId: partial.city.id,
        recent: partial.recent,
        city: partial.city,
        audience: partial.audience,
        profileName: partial.profileName,
        guest: partial.guest,
        features: partial.features,
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
  profileName: "",
  guest: false,
  features: defaultFeatures(),
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
  setProfileName: (profileName) => {
    set({ profileName });
    persist(get());
  },
  setGuest: (guest) => {
    set({ guest });
    persist(get());
  },
  setFeature: (id, on) => {
    const features = { ...get().features, [id]: id === "settings" ? true : on };
    set({ features });
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
        profileName?: string;
        guest?: boolean;
        features?: unknown;
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
        profileName: typeof parsed.profileName === "string" ? parsed.profileName : "",
        guest: parsed.guest === true,
        features: normalizeFeatures(parsed.features),
      });
    } catch {
      /* ignore */
    }
  },
}));
