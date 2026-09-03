import { Card } from "@/components/ui/card";
import { saudiHolidays } from "@/lib/holidays";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function HolidaysApp() {
  const lang = useAppStore((s) => s.lang);
  const list = saudiHolidays();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {L("إجازات ومناسبات المملكة — الوطني والتأسيس والأعياد.", "Kingdom holidays — National Day, Founding Day, and the Eids.")}
      </p>
      <ul className="space-y-2">
        {list.map((h) => (
          <li key={h.id}>
            <Card className={cn("flex items-center justify-between gap-3 px-4 py-4", h.days <= 21 ? "border-primary/40" : "")}>
              <div>
                <p className="font-medium">{lang === "ar" ? h.ar : h.en}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                  {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  }).format(h.date)}
                  <span className="ms-2 text-subtle">{h.kind === "national" ? L("رسمي", "national") : L("هجري", "Hijri")}</span>
                </p>
              </div>
              <p className="font-mono text-sm tabular-nums text-primary">
                {h.days === 0 ? t(lang, "today") : `${h.days} ${t(lang, "days")}`}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
