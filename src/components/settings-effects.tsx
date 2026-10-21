import { useEffect } from "react";
import { useSettings } from "@/store/settings-store";
import { useAppStore } from "@/store/app-store";
export function SettingsEffects() {
  const { settings: s, ready, hydrate } = useSettings();
  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement,
      scheme = matchMedia("(prefers-color-scheme: dark)");
    const colors = {
      green: ["#146455", "#8cd7bc"],
      blue: ["#245da8", "#a3c9ff"],
      purple: ["#7442a1", "#d6b3fa"],
      red: ["#a4343e", "#ffb5ba"],
      brown: ["#76502e", "#e2c09e"],
      teal: ["#087576", "#88dadd"],
    };
    const apply = () => {
      const dark = s.theme === "dark" || (s.theme === "auto" && scheme.matches);
      root.classList.toggle("waha-dark", dark);
      root.style.setProperty("--color-primary", colors[s.accent][dark ? 1 : 0]);
    };
    apply();
    scheme.addEventListener("change", apply);
    root.style.fontSize = { small: "14px", normal: "16px", large: "18px", largest: "20px" }[
      s.fontSize
    ];
    root.dataset.density = s.density;
    root.dataset.background = s.background;
    root.dataset.reducedMotion = String(s.reducedMotion);
    root.dataset.readingFont = s.readingFont;
    root.lang = s.language;
    root.dir = s.language === "ar" ? "rtl" : "ltr";
    useAppStore.getState().setLang(s.language);
    if (s.childMode) useAppStore.getState().setSegment("child");
    else if (useAppStore.getState().segment === "child") useAppStore.getState().setSegment("all");
    try {
      localStorage.setItem("waha:theme", s.theme);
    } catch {
      /* storage unavailable */
    }
    return () => scheme.removeEventListener("change", apply);
  }, [s, ready]);
  useEffect(() => {
    if (!ready) return;
    useAppStore.getState().setCity(s.city);
    if (s.location !== "device" || !navigator.geolocation) return;
    let active = true;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (active)
          useAppStore
            .getState()
            .setCityCoords(p.coords.latitude, p.coords.longitude, "موقعي", "My location");
      },
      () => {},
      { timeout: 8000, maximumAge: 600000 },
    );
    return () => {
      active = false;
    };
  }, [s.city, s.location, ready]);
  return null;
}
