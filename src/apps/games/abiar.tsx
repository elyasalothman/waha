import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHud } from "@/components/game-hud";
import { colorHex, generateLevel, isSolved, pour, type AbiState } from "@/lib/games/abiar";
import { buzz, sfx } from "@/lib/games/sfx";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function deal(level: number): AbiState {
  return generateLevel(level, level * 9973 + Date.now() % 997);
}

export function AbiarApp() {
  const lang = useAppStore((s) => s.lang);
  const [level, setLevel] = useState(1);
  const [state, setState] = useState<AbiState>(() => deal(1));
  const [sel, setSel] = useState<number | null>(null);
  const [hist, setHist] = useState<AbiState[]>([]);
  const [best, setBest] = usePersistent("waha:abiar-best", 0);
  const solved = useMemo(() => isSolved(state), [state]);

  function apply(next: AbiState) {
    setHist((h) => [...h, state].slice(-24));
    setState(next);
    setSel(null);
  }

  function tap(i: number) {
    if (solved) return;
    if (sel == null) {
      if (!state.tubes[i]?.length) return;
      sfx.tap();
      setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    const next = pour(state, sel, i);
    if (!next) {
      sfx.miss();
      setSel(i);
      return;
    }
    sfx.pour();
    buzz(8);
    apply(next);
    if (isSolved(next)) {
      sfx.win();
      const reached = level;
      if (reached > best) setBest(reached);
      writeScore("abiar", reached);
    }
  }

  function nextLevel() {
    const n = level + 1;
    setLevel(n);
    setState(deal(n));
    setSel(null);
    setHist([]);
    sfx.ok();
  }

  function restart() {
    setState(deal(level));
    setSel(null);
    setHist([]);
  }

  return (
    <div className="space-y-4">
      <GameHud
        stats={[
          { label: t(lang, "level"), value: level },
          { label: lang === "ar" ? "السكب" : "Pours", value: state.moves },
          { label: t(lang, "best"), value: best || "—" },
        ]}
      >
        <Button size="sm" variant="outline" disabled={!hist.length} onClick={() => {
          const prev = hist[hist.length - 1];
          if (!prev) return;
          setHist((h) => h.slice(0, -1));
          setState(prev);
          setSel(null);
        }}>
          {lang === "ar" ? "تراجع" : "Undo"}
        </Button>
        <Button size="sm" variant="secondary" onClick={restart}>
          {t(lang, "restart")}
        </Button>
      </GameHud>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "اسكب الماء حتى يستقر كل لون في بئر. المس بئراً ثم أخرى."
          : "Pour until each colour rests in its own well. Tap a well, then another."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {state.tubes.map((tube, i) => {
          const slots = Array.from({ length: state.cap }, (_, s) => tube[s] ?? 0);
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              className={cn(
                "flex w-12 flex-col-reverse gap-1 rounded-b-2xl rounded-t-md border px-1.5 py-1.5 transition-colors",
                sel === i ? "border-primary bg-surface-2" : "border-border bg-surface",
              )}
            >
              {slots.map((color, s) => (
                <span
                  key={s}
                  className="block h-8 rounded-sm"
                  style={{ background: color ? colorHex(color) : "transparent", opacity: color ? 0.92 : 0.15 }}
                />
              ))}
            </button>
          );
        })}
      </div>
      {solved ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-success">{t(lang, "youWin")}</p>
          <Button onClick={nextLevel}>{lang === "ar" ? "البئر التالية" : "Next well"}</Button>
        </div>
      ) : null}
    </div>
  );
}
