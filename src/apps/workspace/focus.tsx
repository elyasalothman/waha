import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

export function FocusApp() {
  const lang = useAppStore((s) => s.lang);
  const [work, setWork] = useState(25);
  const [rest, setRest] = useState(5);
  const [mode, setMode] = useState<"work" | "rest">("work");
  const [left, setLeft] = useState(25 * 60);
  const [run, setRun] = useState(false);
  const [done, setDone] = usePersistent("waha:focus-sessions", 0);

  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (mode === "work") setDone((n) => n + 1);
          const next = mode === "work" ? "rest" : "work";
          setMode(next);
          return (next === "work" ? work : rest) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [run, mode, work, rest, setDone]);

  const m = Math.floor(left / 60);
  const s = left % 60;

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted">{mode === "work" ? (lang === "ar" ? "عمل" : "Work") : lang === "ar" ? "راحة" : "Break"}</p>
      <p className="font-display text-6xl tabular-nums">
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => setRun((v) => !v)}>{run ? t(lang, "pause") : t(lang, "start")}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setRun(false);
            setMode("work");
            setLeft(work * 60);
          }}
        >
          {t(lang, "restart")}
        </Button>
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-2 text-start text-sm">
        <label>
          {lang === "ar" ? "عمل (د)" : "Work (min)"}
          <Input
            type="number"
            value={work}
            onChange={(e) => {
              const n = Number(e.target.value);
              setWork(n);
              if (!run && mode === "work") setLeft(n * 60);
            }}
          />
        </label>
        <label>
          {lang === "ar" ? "راحة (د)" : "Break (min)"}
          <Input type="number" value={rest} onChange={(e) => setRest(Number(e.target.value))} />
        </label>
      </div>
      <p className="text-sm text-muted">{lang === "ar" ? "جلسات مكتملة" : "Sessions"} {done}</p>
    </div>
  );
}
