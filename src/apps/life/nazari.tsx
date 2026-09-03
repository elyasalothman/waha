import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NAZARI } from "@/lib/nazari";
import { t } from "@/lib/i18n";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function NazariApp() {
  const lang = useAppStore((s) => s.lang);
  const [order, setOrder] = useState(() => shuffle(NAZARI.map((_, i) => i)));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = NAZARI[order[i] ?? 0]!;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const total = NAZARI.length;

  function pick(idx: number) {
    if (picked != null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (i + 1 >= total) {
      setDone(true);
      writeScore("nazari", score);
      return;
    }
    setI(i + 1);
    setPicked(null);
  }

  function restart() {
    setOrder(shuffle(NAZARI.map((_, idx) => idx)));
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  const final = useMemo(() => (done ? score : null), [done, score]);

  if (final != null) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{L("النتيجة", "Result")}</p>
        <p className="font-display text-5xl tabular-nums">
          {final}
          <span className="text-2xl text-muted">/{total}</span>
        </p>
        <p className="text-sm text-muted">
          {final >= 16
            ? L("جاهز للاختبار بإذن الله.", "You’re in good shape for the test.")
            : L("راجع المسائل وأعد المحاولة.", "Review the misses and try again.")}
        </p>
        <Button onClick={restart}>{t(lang, "restart")}</Button>
        <p className="text-xs text-subtle">{L("للتعلّم فقط، وليس اختباراً رسمياً.", "For practice only — not the official exam.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs tabular-nums text-muted">
        {i + 1}/{total} · {score} {L("صح", "correct")}
      </p>
      <p className="text-lg font-medium leading-relaxed">{lang === "ar" ? q.ar : q.en}</p>
      <div className="grid gap-2">
        {q.options.map((opt, idx) => {
          const show = picked != null;
          const correct = idx === q.answer;
          const mine = idx === picked;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => pick(idx)}
              className={cn(
                "min-h-12 rounded-xl border px-4 py-3 text-start text-sm",
                !show && "border-border bg-surface hover:bg-surface-2",
                show && correct && "border-success bg-surface-2",
                show && mine && !correct && "border-danger bg-surface",
                show && !correct && !mine && "border-border bg-surface opacity-60",
              )}
            >
              {lang === "ar" ? opt.ar : opt.en}
            </button>
          );
        })}
      </div>
      {picked != null ? (
        <Button onClick={next}>{i + 1 >= total ? L("النتيجة", "Result") : L("التالي", "Next")}</Button>
      ) : null}
      <p className="text-xs text-subtle">{L("للتعلّم فقط، وليس اختباراً رسمياً.", "For practice only — not the official exam.")}</p>
    </div>
  );
}
