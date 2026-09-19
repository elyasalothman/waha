import { ayahOfDay } from "@/lib/daily";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

/** Single verse above the fold — not the daily slideshow, not a catalog card. */
export function DayAyah() {
  const lang = useAppStore((s) => s.lang);
  const ayah = ayahOfDay();
  return (
    <p
      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-border px-1 py-1.5 text-[13px] leading-relaxed text-fg/90"
      aria-label={t(lang, "ayah")}
    >
      <span className="text-[11px] text-subtle">{t(lang, "ayah")}</span>
      <span className="font-display">{ayah.ar}</span>
      <span className="text-[11px] text-subtle">{lang === "ar" ? ayah.refAr : ayah.refEn}</span>
    </p>
  );
}
