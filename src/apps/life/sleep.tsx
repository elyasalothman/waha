import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { useAppStore } from "@/store/app-store";

function parseHm(v: string) {
  const [h, m] = v.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fmt(mins: number, lang: "ar" | "en") {
  const n = ((mins % 1440) + 1440) % 1440;
  const d = new Date(2000, 0, 1, Math.floor(n / 60), n % 60);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", { hour: "numeric", minute: "2-digit" }).format(d);
}

export function SleepApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"wake" | "sleep">("wake");
  const [time, setTime] = useState("06:30");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const FALL = 15;

  const slots = useMemo(() => {
    const base = parseHm(time);
    const cycles = [6, 5, 4];
    if (mode === "wake") {
      return cycles.map((c) => ({ c, at: base - FALL - c * 90 }));
    }
    return cycles.map((c) => ({ c, at: base + FALL + c * 90 }));
  }, [mode, time]);

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={mode}
        onChange={setMode}
        options={[
          { id: "wake", ar: "أريد أن أستيقظ", en: "I need to wake" },
          { id: "sleep", ar: "سأنام الآن", en: "I’m going to bed" },
        ]}
      />
      {mode === "wake" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("وقت الاستيقاظ", "Wake time")}</span>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      ) : null}
      <p className="text-sm text-muted">
        {mode === "wake"
          ? L("نم في أحد هذه الأوقات لتستيقظ في نهاية دورة.", "Fall asleep at one of these times to wake at the end of a cycle.")
          : L("استيقظ في أحد هذه الأوقات بعد دورات كاملة.", "Wake at one of these times after full cycles.")}
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {slots.map((s) => (
          <li key={s.c} className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-xs text-muted">{L(`${s.c} دورات`, `${s.c} cycles`)}</p>
            <p className="mt-1 font-mono text-2xl tabular-nums">{fmt(s.at, lang)}</p>
            <p className="mt-1 text-xs text-subtle">{L(`${s.c * 1.5} ساعة + ١٥ د`, `${s.c * 1.5}h + 15m`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
