import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const AR = ["مدرسة", "حديقة", "رسالة", "نافذة", "سيارة", "مكتبة", "طبيعة", "مدينة", "صداقة", "عائلة", "حقيقة", "طريقة", "نتيجة", "سحابة", "طائرة", "خريطة", "جريدة", "بداية", "نهاية", "قائمة", "ذاكرة", "عبارة", "قراءة", "كتابة", "صناعة", "زراعة", "تجارة", "حديقة"];
const EN = ["crane", "slate", "audio", "plant", "smile", "grape", "light", "night", "water", "earth", "stone", "bread", "table", "chair", "house", "heart", "music", "dream", "cloud", "river", "flame", "sugar", "lemon", "olive", "spice", "faith", "peace", "noble"];
const AR_OK = new Set(AR);
const EN_OK = new Set(EN);

type Tone = "correct" | "present" | "absent";

function score(guess: string, answer: string): Tone[] {
  const a = answer.split("");
  const g = guess.split("");
  const out: Tone[] = Array(5).fill("absent");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) {
      out[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (out[i] === "correct") continue;
    const j = a.findIndex((ch, idx) => !used[idx] && ch === g[i]);
    if (j >= 0) {
      out[i] = "present";
      used[j] = true;
    }
  }
  return out;
}

export function KalimaApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"ar" | "en">(lang);
  const pool = mode === "ar" ? AR : EN;
  const [answer, setAnswer] = useState(() => pool[Math.floor(Math.random() * pool.length)]!);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [cur, setCur] = useState("");
  const [msg, setMsg] = useState("");
  const done = guesses.includes(answer) || guesses.length >= 6;
  const won = guesses.includes(answer);
  const alphabet = useMemo(() => {
    if (mode === "en") return "qwertyuiopasdfghjklzxcvbnm".split("");
    return "أبتثجحخدذرزسشصضطظعغفقكلمنهويىة".split("");
  }, [mode]);

  function deal(nextMode = mode) {
    const p = nextMode === "ar" ? AR : EN;
    setMode(nextMode);
    setAnswer(p[Math.floor(Math.random() * p.length)]!);
    setGuesses([]);
    setCur("");
    setMsg("");
  }

  function submit(word: string) {
    const w = word.trim();
    if (w.length !== 5) {
      setMsg(lang === "ar" ? "خمس أحرف" : "Five letters");
      return;
    }
    const ok = mode === "ar" ? AR_OK.has(w) : EN_OK.has(w);
    if (!ok) {
      setMsg(lang === "ar" ? "ليست في القائمة" : "Not in the list");
      return;
    }
    const next = [...guesses, w];
    setGuesses(next);
    setCur("");
    setMsg("");
    if (w === answer) writeScore("kalima", 7 - next.length);
  }

  function key(ch: string) {
    if (done) return;
    if (ch === "enter") return submit(cur);
    if (ch === "del") return setCur((s) => s.slice(0, -1));
    if (cur.length >= 5) return;
    setCur((s) => s + ch);
  }

  const rows = [...guesses, ...(done ? [] : [cur])];
  while (rows.length < 6) rows.push("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
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
          const tones = guesses[r] ? score(guesses[r]!, answer) : null;
          return (
            <div key={r} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, c) => (
                <div
                  key={c}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border text-lg font-medium",
                    tones
                      ? tones[c] === "correct"
                        ? "border-success bg-success/20 text-fg"
                        : tones[c] === "present"
                          ? "border-warn bg-warn/20 text-fg"
                          : "border-border bg-surface-2 text-muted"
                      : "border-border bg-surface",
                  )}
                >
                  {word[c] ?? ""}
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
        {alphabet.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => key(ch)}
            className="h-11 min-w-8 rounded-md border border-border bg-surface px-2 text-sm hover:bg-surface-2"
          >
            {ch}
          </button>
        ))}
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
