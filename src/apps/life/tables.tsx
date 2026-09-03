import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Seg } from "@/components/seg";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function TablesApp() {
  const lang = useAppStore((s) => s.lang);
  const [n, setN] = useState(7);
  const [mode, setMode] = useState<"list" | "quiz">("list");
  const [q, setQ] = useState(() => ({ a: 7, b: 3 }));
  const [picked, setPicked] = useState<number | null>(null);
  const [ok, setOk] = useState(0);
  const [tries, setTries] = useState(0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const rows = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const answer = q.a * q.b;
  const choices = useMemo(() => {
    const set = new Set<number>([answer]);
    while (set.size < 4) set.add(answer + (Math.floor(Math.random() * 11) - 5) * (Math.random() < 0.5 ? 1 : q.a));
    return [...set].sort((a, b) => a - b);
  }, [answer, q]);

  function ask(base = n) {
    setQ({ a: base, b: 1 + Math.floor(Math.random() * 12) });
    setPicked(null);
  }

  function pick(v: number) {
    if (picked != null) return;
    setPicked(v);
    setTries((t) => t + 1);
    if (v === answer) setOk((s) => s + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {rows.map((x) => (
          <Button key={x} size="sm" variant={n === x ? "default" : "secondary"} onClick={() => { setN(x); ask(x); }}>
            {x}
          </Button>
        ))}
      </div>
      <Seg
        lang={lang}
        value={mode}
        onChange={(m) => {
          setMode(m);
          if (m === "quiz") ask();
        }}
        options={[
          { id: "list", ar: "الجدول", en: "Table" },
          { id: "quiz", ar: "اختبار", en: "Quiz" },
        ]}
      />
      {mode === "list" ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rows.map((x) => (
            <li key={x} className="rounded-lg border border-border bg-surface px-3 py-2 font-mono tabular-nums">
              {n} × {x} = {n * x}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <p className="font-display text-4xl tabular-nums">
            {q.a} × {q.b}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pick(c)}
                className={cn(
                  "min-h-14 rounded-xl border font-mono text-xl tabular-nums",
                  picked == null && "border-border bg-surface hover:bg-surface-2",
                  picked != null && c === answer && "border-success bg-surface-2",
                  picked === c && c !== answer && "border-danger bg-surface",
                  picked != null && c !== answer && picked !== c && "border-border bg-surface opacity-50",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {picked != null ? (
            <Button onClick={() => ask()}>{L("سؤال آخر", "Next")}</Button>
          ) : null}
          <p className="text-sm text-muted">
            {ok}/{tries} {L("صح", "correct")}
          </p>
        </div>
      )}
    </div>
  );
}
