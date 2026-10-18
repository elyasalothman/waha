import { calculate } from "@/lib/calculator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const KEYS = [
  "AC",
  "(",
  ")",
  "÷",
  "7",
  "8",
  "9",
  "×",
  "4",
  "5",
  "6",
  "−",
  "1",
  "2",
  "3",
  "+",
  "0",
  ".",
  "±",
  "=",
  "sin",
  "cos",
  "tan",
  "√",
  "ln",
  "log",
  "π",
  "e",
  "^",
  "%",
] as const;

export function CalcApp() {
  const lang = useAppStore((s) => s.lang);
  const [scientific, setScientific] = useState(false);
  const [arabic, setArabic] = useState(false);
  const [expr, setExpr] = useState("");
  const [hist, setHist] = usePersistent<string[]>("waha:calc-history", []);

  function press(k: string) {
    navigator.vibrate?.(8);
    if (k === "⌫") return setExpr((s) => s.slice(0, -1));
    if (k === "AC") return setExpr("");
    if (k === "±") {
      setExpr((s) => (s.startsWith("-") ? s.slice(1) : `-${s}`));
      return;
    }
    if (k === "=") {
      try {
        const n = calculate(expr);
        const line = `${expr} = ${n}`;
        setHist((h) => [line, ...h].slice(0, 20));
        setExpr(String(n));
      } catch {
        setExpr(lang === "ar" ? "خطأ" : "Error");
      }
      return;
    }
    const value = ["sin", "cos", "tan", "√", "ln", "log"].includes(k) ? k + "(" : k;
    setExpr((s) => (s === "Error" || s === "خطأ" ? value : s + value));
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded-xl border border-border px-3"
            aria-pressed={scientific}
            onClick={() => setScientific(!scientific)}
          >
            {scientific ? "علمية · درجات" : "عادية"}
          </button>
          <button
            className="min-h-11 rounded-xl border border-border px-3"
            onClick={() => setArabic(!arabic)}
          >
            ١٢٣ / 123
          </button>
          <button aria-label="حذف رقم" className="min-h-11 px-4" onClick={() => press("⌫")}>
            ⌫
          </button>
        </div>
        <input
          aria-label="العملية الحسابية"
          dir="ltr"
          value={arabic ? expr.replace(/\d/g, (n) => "٠١٢٣٤٥٦٧٨٩"[Number(n)]) : expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") press("=");
          }}
          className="mb-3 min-h-16 w-full min-w-0 rounded-lg border border-border bg-surface p-3 text-end font-mono text-2xl"
          placeholder="0"
        />
        <div className="grid grid-cols-4 gap-2">
          {(scientific ? KEYS : KEYS.slice(0, 20)).map((k) => (
            <Button
              key={k}
              variant={k === "=" ? "default" : "secondary"}
              className={cn(k === "AC" && "text-danger")}
              onClick={() => press(k)}
            >
              {arabic ? k.replace(/\d/g, (n) => "٠١٢٣٤٥٦٧٨٩"[Number(n)]) : k}
            </Button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-xs text-muted">{lang === "ar" ? "السجل" : "Tape"}</p>
        <button className="mb-2 min-h-11 text-sm text-primary" onClick={() => setHist([])}>
          مسح السجل
        </button>
        <ul dir="ltr" className="space-y-1 font-mono text-sm text-muted">
          {hist.length === 0 ? (
            <li>{lang === "ar" ? "فارغ" : "Empty"}</li>
          ) : (
            hist.map((h, i) => <li key={i}>{h}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}
