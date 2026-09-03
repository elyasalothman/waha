import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Phase = "idle" | "wait" | "go" | "early" | "done";

export function ReactionApp() {
  const lang = useAppStore((s) => s.lang);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = useState(() => (typeof window === "undefined" ? 0 : readScore("reaction")));
  const startRef = useRef(0);
  const timerRef = useRef(0);

  function arm() {
    window.clearTimeout(timerRef.current);
    setPhase("wait");
    setMs(null);
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, 900 + Math.random() * 2800);
  }

  function tap() {
    if (phase === "wait") {
      window.clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase === "go") {
      const n = Math.round(performance.now() - startRef.current);
      setMs(n);
      setPhase("done");
      const inverted = Math.max(0, 1000 - n);
      const next = writeScore("reaction", inverted);
      setBest(next);
    }
  }

  const label =
    phase === "idle"
      ? lang === "ar"
        ? "جاهز"
        : "Ready"
      : phase === "wait"
        ? lang === "ar"
          ? "انتظر الأخضر…"
          : "Wait for green…"
        : phase === "go"
          ? lang === "ar"
            ? "الآن"
            : "Now"
          : phase === "early"
            ? lang === "ar"
              ? "مبكر"
              : "Too soon"
            : `${ms} ms`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Stat label={lang === "ar" ? "الزمن" : "Time"} value={ms == null ? "—" : `${ms} ms`} />
        <Stat label={t(lang, "best")} value={best ? `${1000 - best} ms` : "—"} />
      </div>
      <button
        type="button"
        onClick={() => (phase === "wait" || phase === "go" ? tap() : arm())}
        className={cn(
          "flex min-h-56 w-full items-center justify-center rounded-xl border text-2xl font-medium",
          phase === "go" ? "border-success bg-success/20 text-fg" : "border-border bg-surface",
          phase === "early" && "border-danger text-danger",
        )}
      >
        {label}
      </button>
      <Button variant="secondary" onClick={arm}>
        {t(lang, "restart")}
      </Button>
    </div>
  );
}
