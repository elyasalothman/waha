import { useSettings } from "@/store/settings-store";
import { useId } from "react";
import { CITIES } from "@/lib/cities";
import { t, type Lang } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function CitySelect({ compact = false }: { compact?: boolean }) {
  const cityId = useId();
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const setCity = useAppStore((s) => s.setCity);
  const setCityCoords = useAppStore((s) => s.setCityCoords);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          useSettings.getState().update({ location: "device" });
        } catch {
          /* optional */
        }
        setCityCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          lang === "ar" ? "موقعي" : "My location",
          "My location",
        );
      },
      () => {
        /* stay */
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className={cn("flex items-center gap-2", compact && "w-full")}>
      <label className="sr-only" htmlFor={cityId}>
        {t(lang, "city")}
      </label>
      <select
        id={cityId}
        className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-fg"
        value={city.id === "geo" ? "" : city.id}
        onChange={(e) => {
          setCity(e.target.value);
          try {
            useSettings.getState().update({ city: e.target.value, location: "manual" });
          } catch {
            /* optional */
          }
        }}
      >
        {city.id === "geo" ? <option value="">{lang === "ar" ? city.ar : city.en}</option> : null}
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {lang === "ar" ? `${c.ar} — ${c.countryAr}` : `${c.en} — ${c.countryEn}`}
          </option>
        ))}
      </select>
      <Button type="button" variant="secondary" size="default" onClick={locate}>
        {t(lang, "useLocation")}
      </Button>
    </div>
  );
}

export function LangToggle({ lang }: { lang: Lang }) {
  const toggleLang = useAppStore((s) => s.toggleLang);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        toggleLang();
        try {
          useSettings.getState().update({ language: useAppStore.getState().lang });
        } catch {
          /* local storage */
        }
      }}
      className="h-11 min-w-11"
    >
      {t(lang, "language")}
    </Button>
  );
}
