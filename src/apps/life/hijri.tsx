import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  formatGregorian,
  formatHijri,
  hijriToGregorian,
  HIJRI_MONTHS,
  toHijri,
  upcomingOccasions,
} from "@/lib/hijri";
import { t } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";

export function HijriApp() {
  const lang = useAppStore((s) => s.lang);
  const now = useNow(60_000);
  const h = toHijri(now);
  const [gy, setGy] = useState(now.getFullYear());
  const [gm, setGm] = useState(now.getMonth() + 1);
  const [gd, setGd] = useState(now.getDate());
  const [hy, setHy] = useState(h.hy);
  const [hm, setHm] = useState(h.hm);
  const [hd, setHd] = useState(h.hd);
  const [outG, setOutG] = useState<string | null>(null);
  const [outH, setOutH] = useState<string | null>(null);
  const occasions = useMemo(() => upcomingOccasions(now, lang), [now, lang]);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="font-display text-3xl">{formatHijri(now, lang, true)}</p>
        <p className="mt-2 text-muted">{formatGregorian(now, lang)}</p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium">{lang === "ar" ? "ميلادي → هجري" : "Gregorian → Hijri"}</p>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" value={gd} onChange={(e) => setGd(+e.target.value)} />
            <Input type="number" value={gm} onChange={(e) => setGm(+e.target.value)} />
            <Input type="number" value={gy} onChange={(e) => setGy(+e.target.value)} />
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              const d = new Date(gy, gm - 1, gd);
              setOutH(formatHijri(d, lang));
            }}
          >
            {lang === "ar" ? "حوّل" : "Convert"}
          </Button>
          {outH ? <p className="mt-3 text-primary">{outH}</p> : null}
        </Card>
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium">{lang === "ar" ? "هجري → ميلادي" : "Hijri → Gregorian"}</p>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" value={hd} onChange={(e) => setHd(+e.target.value)} />
            <select
              className="h-11 rounded-md border border-border bg-surface px-2 text-sm"
              value={hm}
              onChange={(e) => setHm(+e.target.value)}
            >
              {HIJRI_MONTHS[lang].map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <Input type="number" value={hy} onChange={(e) => setHy(+e.target.value)} />
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              const d = hijriToGregorian(hy, hm, hd);
              setOutG(d ? formatGregorian(d, lang) : lang === "ar" ? "تاريخ غير صالح" : "Invalid date");
            }}
          >
            {lang === "ar" ? "حوّل" : "Convert"}
          </Button>
          {outG ? <p className="mt-3 text-primary">{outG}</p> : null}
        </Card>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium">{t(lang, "occasions")}</h2>
        <div className="space-y-2">
          {occasions.map((o) => (
            <div key={o.title} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-3">
              <span>{o.title}</span>
              <span className="font-mono text-sm tabular-nums text-muted">
                {o.days === 0 ? t(lang, "today") : `${o.days} ${t(lang, "days")}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
