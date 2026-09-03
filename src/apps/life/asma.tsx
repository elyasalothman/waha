import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASMA, asmaOfDay } from "@/lib/asma";
import { speak } from "@/lib/speak";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function AsmaApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState("");
  const today = asmaOfDay();
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return ASMA;
    return ASMA.filter((a) => a.ar.includes(q.trim()) || a.en.toLowerCase().includes(n) || String(a.n) === n);
  }, [q]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-xs text-muted">{L("اسم اليوم", "Today’s name")}</p>
        <h2 className="mt-2 font-display text-4xl">{today.ar}</h2>
        <p className="mt-2 text-sm text-muted">
          {today.n}. {lang === "ar" ? today.meanAr : today.meanEn}
        </p>
        <Button className="mt-4" variant="secondary" size="sm" onClick={() => speak(today.ar, "ar")}>
          {L("استمع", "Listen")}
        </Button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("ابحث في التسعة والتسعين…", "Search the ninety-nine…")} />
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.n}>
            <button
              type="button"
              onClick={() => speak(a.ar, "ar")}
              className={cn(
                "flex w-full min-h-16 flex-col items-start rounded-xl border px-4 py-3 text-start hover:bg-surface-2",
                a.n === today.n ? "border-primary bg-surface-2" : "border-border bg-surface",
              )}
            >
              <span className="flex w-full items-baseline justify-between gap-2">
                <span className="font-display text-xl">{a.ar}</span>
                <span className="font-mono text-xs tabular-nums text-subtle">{a.n}</span>
              </span>
              <span className="mt-1 text-sm text-muted">{lang === "ar" ? a.meanAr : a.meanEn}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
