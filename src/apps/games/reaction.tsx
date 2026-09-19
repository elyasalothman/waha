import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Phase = "idle" | "wait" | "go" | "early" | "done";
const ROUNDS = 3;

export function ReactionApp() {
  const lang = useAppStore((s) => s.lang);
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = usePersistent("waha:reaction-best-ms", 0);
  const startRef = useRef(0);
  const timerRef = useRef(0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function arm() {
    window.clearTimeout(timerRef.current);
    setPhase("wait");
    setMs(null);
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, 900 + Math.random() * 2200);
  }

  function begin() {
    window.clearTimeout(timerRef.current);
    setTimes([]);
    setMs(null);
    arm();
  }

  function tap() {
    if (phase === "wait") {
      window.clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase !== "go") return;
    const n = Math.round(performance.now() - startRef.current);
    const nextTimes = [...times, n];
    setMs(n);
    setTimes(nextTimes);
    if (best === 0 || n < best) setBest(n);
    if (nextTimes.length >= ROUNDS) setPhase("done");
    else {
      setPhase("wait");
      timerRef.current = window.setTimeout(() => {
        startRef.current = performance.now();
        setPhase("go");
      }, 700 + Math.random() * 1800);
    }
  }

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const label =
    phase === "idle"
      ? L("ثلاث لمسات — اضغط للبدء", "Three taps — press to begin")
      : phase === "wait"
        ? L("انتظر الأخضر…", "Wait for green…")
        : phase === "go"
          ? L("الآن", "Now")
          : phase === "early"
            ? L("مبكر — أعد", "Too soon — again")
            : L(`المعدّل ${avg} ms`, `Average ${avg} ms`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={L("اللمسة", "Tap")} value={`${Math.min(times.length + (phase === "done" ? 0 : phase === "idle" ? 0 : 1), ROUNDS)} / ${ROUNDS}`} />
        <Stat label={L("الزمن", "Time")} value={ms == null ? "—" : `${ms} ms`} />
        <Stat label={t(lang, "best")} value={best ? `${best} ms` : "—"} />
      </div>
      <button
        type="button"
        onClick={() => (phase === "wait" || phase === "go" ? tap() : phase === "early" ? arm() : begin())}
        className={cn(
          "flex min-h-56 w-full items-center justify-center rounded-xl border text-2xl font-medium transition-colors duration-150",
          phase === "go" ? "border-success bg-success/20 text-fg" : "border-border bg-surface",
          phase === "early" && "border-danger text-danger",
          phase === "done" && "border-primary",
        )}
      >
        {label}
      </button>
      {times.length > 0 ? (
        <p className="text-center font-mono text-sm tabular-nums text-muted">{times.map((n) => `${n}ms`).join(" · ")}</p>
      ) : null}
      <Button variant="secondary" onClick={begin}>
        {phase === "idle" ? t(lang, "start") : t(lang, "restart")}
      </Button>
    </div>
  );
}
