import { CITIES } from "@/lib/cities";
import { create } from "zustand";
import {
  defaultSettings,
  parseSettings,
  saveSettings,
  SETTINGS_KEY,
  type Settings,
} from "@/lib/settings";
export const useSettings = create<{
  settings: Settings;
  ready: boolean;
  hydrate: () => void;
  update: (patch: Partial<Settings>) => void;
}>((set, get) => ({
  settings: defaultSettings,
  ready: false,
  hydrate() {
    if (get().ready) return;
    let settings = defaultSettings;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) settings = parseSettings(JSON.parse(raw));
      else {
        const theme = localStorage.getItem("waha:theme");
        if (theme === "dark" || theme === "light") settings = { ...settings, theme };
        const prefs = JSON.parse(localStorage.getItem("waha:prefs") || "{}");
        settings = {
          ...settings,
          language: prefs.lang === "en" ? "en" : "ar",
          city: CITIES.some((c) => c.id === prefs.cityId) ? prefs.cityId : "riyadh",
          childMode: prefs.segment === "child",
        };
      }
    } catch {
      /* invalid stored values use defaults */
    }
    set({ settings, ready: true });
  },
  update(patch) {
    const settings = saveSettings(localStorage, get().settings, patch);
    set({ settings });
  },
}));
