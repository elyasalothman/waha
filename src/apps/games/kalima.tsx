import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { kalimaKeyTones, kalimaOk, kalimaPool, pickKalima, scoreKalima } from "@/lib/games/kalima";
import { playSfx } from "@/lib/sfx";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function KalimaApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"ar" | "en">(lang);
  const [answer, setAnswer] = useState(() => pickKalima(lang));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [cur, setCur] = useState("");
  const [msg, setMsg] = useState("");
  const [best, setBest] = useState(0);
  const done = guesses.includes(answer) || guesses.length >= 6;
  const won = guesses.includes(answer);
  const keyTones = useMemo(() => kalimaKeyTones(guesses, answer), [guesses, answer]);
  const alphabet = useMemo(() => {
    if (mode === "en") return "qwertyuiopasdfghjklzxcvbnm".split("");
    return "أبتثجحخدذرزسشصضطظعغفقكلمنهويىة".split("");
  }, [mode]);

  useEffect(() => {
    setBest(readScore("kalima"));
  }, []);

  function deal(nextMode = mode) {
    setMode(nextMode);
    setAnswer(pickKalima(nextMode));
    setGuesses([]);
    setCur("");
    setMsg("");
  }

  function submit(word: string) {
    const w = word.trim();
    if ([...w].length !== 5) {
      setMsg(lang === "ar" ? "خمس أحرف" : "Five letters");
      playSfx("miss");
      return;
    }
    if (!kalimaOk(mode).has(w)) {
      setMsg(lang === "ar" ? "ليست في القائمة" : "Not in the list");
      playSfx("miss");
      return;
    }
    const next = [...guesses, w];
    setGuesses(next);
    setCur("");
    setMsg("");
    if (w === answer) {
      playSfx("win");
      setBest(writeScore("kalima", 7 - next.length));
    } else if (next.length >= 6) playSfx("miss");
    else playSfx("ok");
  }

  function key(ch: string) {
    if (done) return;
    if (ch === "enter") return submit(cur);
    if (ch === "del") return setCur((s) => [...s].slice(0, -1).join(""));
    if ([...cur].length >= 5) return;
    playSfx("tap");
    setCur((s) => s + ch);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        key("enter");
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        key("del");
        return;
      }
      if (mode === "en" && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        key(e.key.toLowerCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const rows = [...guesses, ...(done ? [] : [cur])];
  while (rows.length < 6) rows.push("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label={lang === "ar" ? "المحاولة" : "Try"} value={`${guesses.length}/6`} />
        <Stat label={t(lang, "best")} value={best || "—"} />
        <Stat label={lang === "ar" ? "الكلمات" : "Words"} value={kalimaPool(mode).length} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === "ar" ? "default" : "secondary"} onClick={() => deal("ar")}>
          العربية
        </Button>
        <Button size="sm" variant={mode === "en" ? "default" : "secondary"} onClick={() => deal("en")}>
          English
        </Button>
        <Button size="sm" variant="outline" onClick={() => deal(mode)}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="mx-auto grid max-w-xs gap-1.5">
        {rows.map((word, r) => {
          const tones = guesses[r] ? scoreKalima(guesses[r]!, answer) : null;
          const letters = [...word];
          return (
            <div key={r} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, c) => (
                <div
                  key={c}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border text-lg font-medium transition-colors duration-200",
                    tones
                      ? tones[c] === "correct"
                        ? "border-success bg-success/20 text-fg"
                        : tones[c] === "present"
                          ? "border-warn bg-warn/20 text-fg"
                          : "border-border bg-surface-2 text-muted"
                      : "border-border bg-surface",
                    !tones && letters[c] ? "border-primary/50" : null,
                  )}
                >
                  {letters[c] ?? ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
      {done ? (
        <p className="text-center text-sm">
          {won ? t(lang, "youWin") : t(lang, "gameOver")} · {answer}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-1">
        {alphabet.map((ch) => {
          const tone = keyTones[ch];
          return (
            <button
              key={ch}
              type="button"
              onClick={() => key(ch)}
              className={cn(
                "h-11 min-w-8 rounded-md border px-2 text-sm active:scale-95",
                tone === "correct"
                  ? "border-success bg-success/20"
                  : tone === "present"
                    ? "border-warn bg-warn/20"
                    : tone === "absent"
                      ? "border-border bg-surface-2 text-subtle"
                      : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              {ch}
            </button>
          );
        })}
        <Button size="sm" variant="secondary" onClick={() => key("del")}>
          ⌫
        </Button>
        <Button size="sm" onClick={() => key("enter")}>
          {lang === "ar" ? "أدخل" : "Enter"}
        </Button>
      </div>
    </div>
  );
}
