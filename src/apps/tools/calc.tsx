import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const KEYS = ["AC", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "±", "=", "sin", "cos", "tan", "√", "ln", "log", "π", "e", "^", "%"] as const;

function sanitize(expr: string) {
  const mapped = expr
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("π", "PI")
    .replaceAll("√", "sqrt")
    .replaceAll("^", "**")
    .replaceAll("%", "/100");
  if (!/^[0-9+\-*/().,\sA-Za-z*]+$/.test(mapped)) throw new Error("bad");
  return mapped;
}

function evalExpr(expr: string): number {
  const e = sanitize(expr);
  const f = new Function(
    "PI",
    "e",
    "sin",
    "cos",
    "tan",
    "sqrt",
    "ln",
    "log",
    `"use strict"; return (${e});`,
  );
  const d = Math.PI / 180;
  const n = f(Math.PI, Math.E, (x: number) => Math.sin(x * d), (x: number) => Math.cos(x * d), (x: number) => Math.tan(x * d), Math.sqrt, Math.log, (x: number) => Math.log10(x));
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("nan");
  return n;
}

export function CalcApp() {
  const lang = useAppStore((s) => s.lang);
  const [expr, setExpr] = useState("");
  const [hist, setHist] = usePersistent<string[]>("waha:calc-history", []);

  function press(k: string) {
    if (k === "AC") return setExpr("");
    if (k === "±") {
      setExpr((s) => (s.startsWith("-") ? s.slice(1) : `-${s}`));
      return;
    }
    if (k === "=") {
      try {
        const n = evalExpr(expr);
        const line = `${expr} = ${n}`;
        setHist((h) => [line, ...h].slice(0, 20));
        setExpr(String(n));
      } catch {
        setExpr(lang === "ar" ? "خطأ" : "Error");
      }
      return;
    }
    setExpr((s) => (s === "Error" || s === "خطأ" ? k : s + k));
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="mb-3 min-h-16 rounded-lg border border-border bg-surface px-3 py-4 text-end font-mono text-3xl tabular-nums">
          {expr || "0"}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {KEYS.map((k) => (
            <Button
              key={k}
              variant={k === "=" ? "default" : "secondary"}
              className={cn(k === "AC" && "text-danger")}
              onClick={() => press(k)}
            >
              {k}
            </Button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-xs text-muted">{lang === "ar" ? "السجل" : "Tape"}</p>
        <ul className="space-y-1 font-mono text-sm text-muted">
          {hist.length === 0 ? <li>{lang === "ar" ? "فارغ" : "Empty"}</li> : hist.map((h) => <li key={h}>{h}</li>)}
        </ul>
      </div>
    </div>
  );
}
