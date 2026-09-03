import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Phase = "in" | "hold" | "out" | "idle";

export function BreatheApp() {
  const lang = useAppStore((s) => s.lang);
  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    if (!on) {
      setPhase("idle");
      return;
    }
    let p: Phase = "in";
    let t = 4;
    setPhase("in");
    setLeft(4);
    const id = window.setInterval(() => {
      t -= 1;
      if (t <= 0) {
        if (p === "in") {
          p = "hold";
          t = 7;
        } else if (p === "hold") {
          p = "out";
          t = 8;
        } else {
          p = "in";
          t = 4;
          setCycles((c) => c + 1);
        }
        setPhase(p);
      }
      setLeft(t);
    }, 1000);
    return () => window.clearInterval(id);
  }, [on]);

  const label = phase === "in" ? L("شهيق", "Inhale") : phase === "hold" ? L("احبس", "Hold") : phase === "out" ? L("زفير", "Exhale") : L("أربع-سبعة-ثمانية", "4-7-8");
  const scale = phase === "in" ? "scale-110" : phase === "hold" ? "scale-110" : phase === "out" ? "scale-75" : "scale-90";

  return (
    <div className="flex flex-col items-center py-6">
      <div
        className={cn(
          "flex size-48 items-center justify-center rounded-full border border-border bg-surface-2 transition-transform duration-1000 ease-in-out",
          scale,
        )}
      >
        <div className="text-center">
          <p className="font-display text-3xl">{label}</p>
          {on ? <p className="mt-1 font-mono text-xl tabular-nums text-muted">{left}</p> : null}
        </div>
      </div>
      <p className="mt-6 text-sm text-muted">{L(`${cycles} دورة`, `${cycles} cycles`)}</p>
      <Button className="mt-4" onClick={() => setOn((v) => !v)}>
        {on ? t(lang, "pause") : t(lang, "start")}
      </Button>
      <p className="mt-4 max-w-sm text-center text-sm text-muted">
        {L("شهيق ٤، حبس ٧، زفير ٨. من تمرينات الاسترخاء الشائعة.", "Inhale 4, hold 7, exhale 8. A common settling breath.")}
      </p>
    </div>
  );
}
