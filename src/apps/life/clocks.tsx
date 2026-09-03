import { CITIES } from "@/lib/cities";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";

export function ClocksApp() {
  const lang = useAppStore((s) => s.lang);
  const home = useAppStore((s) => s.city);
  const now = useNow(1000);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CITIES.map((c) => {
        const text = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZone: c.tz,
          weekday: "short",
        }).format(now);
        const mine = c.id === home.id;
        return (
          <Card key={c.id} className={`px-4 py-3 ${mine ? "border-primary" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{lang === "ar" ? c.ar : c.en}</div>
                <div className="text-xs text-muted">{lang === "ar" ? c.countryAr : c.countryEn}</div>
              </div>
              <div className="font-mono text-lg tabular-nums">{text}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
