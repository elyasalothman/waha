import { CITIES } from "@/lib/cities";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export { LangToggle, LangSelect } from "@/components/lang-select";

export function CitySelect({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const setCity = useAppStore((s) => s.setCity);
  const setCityCoords = useAppStore((s) => s.setCityCoords);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
      <label className="sr-only">{t(lang, "city")}</label>
      <select
        className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-fg"
        value={city.id === "geo" ? "" : city.id}
        onChange={(e) => setCity(e.target.value)}
      >
        {city.id === "geo" ? (
          <option value="">{lang === "ar" ? city.ar : city.en}</option>
        ) : null}
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {lang === "ar" ? `${c.ar} — ${c.countryAr}` : `${c.en} — ${c.countryEn}`}
          </option>
        ))}
      </select>
      <Button type="button" variant="secondary" size={compact ? "sm" : "default"} onClick={locate}>
        {t(lang, "useLocation")}
      </Button>
    </div>
  );
}

