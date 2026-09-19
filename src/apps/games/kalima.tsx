import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const AR = [
  "مدرسة", "حديقة", "رسالة", "نافذة", "سيارة", "مكتبة", "طبيعة", "مدينة", "صداقة", "عائلة",
  "حقيقة", "طريقة", "نتيجة", "سحابة", "طائرة", "خريطة", "جريدة", "بداية", "نهاية", "قائمة",
  "ذاكرة", "عبارة", "قراءة", "كتابة", "صناعة", "زراعة", "تجارة", "مفتاح", "وسادة", "إشارة",
  "حكاية", "رواية", "قصيدة", "مائدة", "عدالة", "معرفة", "مسألة", "جامعة", "وزارة", "حكومة",
  "سفارة", "جزيرة", "مملكة", "خلافة", "عبادة", "سعادة", "كرامة", "شجاعة", "غسالة", "ثلاجة",
  "عاصمة", "ولاية", "قرابة", "ضيافة", "نظافة", "طهارة", "حديقة", "مملكة", "إشارة", "مفتاح",
];
const EN = [
  "crane", "slate", "audio", "plant", "smile", "grape", "light", "night", "water", "earth",
  "stone", "bread", "table", "chair", "house", "heart", "music", "dream", "cloud", "river",
  "flame", "sugar", "lemon", "olive", "spice", "faith", "peace", "noble", "quiet", "oasis",
  "dates", "amber", "cedar", "pearl", "coral", "maple", "wheat", "honey", "linen", "ivory",
  "brave", "calm", "grace", "honor", "mercy", "truth", "verse", "story", "paper", "inked",
];
const AR_OK = new Set(AR.filter((w) => w.length === 5));
const EN_OK = new Set(EN.filter((w) => w.length === 5));

type Tone = "correct" | "present" | "absent";

function scoreGuess(guess: string, answer: string): Tone[] {
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

function rankTone(a?: Tone, b?: Tone): Tone | undefined {
  const order: Tone[] = ["absent", "present", "correct"];
  if (!a) return b;
  if (!b) return a;
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

export function KalimaApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"ar" | "en">(lang);
  const pool = mode === "ar" ? [...AR_OK] : [...EN_OK];
  const [answer, setAnswer] = useState(() => pool[Math.floor(Math.random() * pool.length)]!);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [cur, setCur] = useState("");
  const [msg, setMsg] = useState("");
  const [best, setBest] = useState(0);
  const done = guesses.includes(answer) || guesses.length >= 6;
  const won = guesses.includes(answer);
  const alphabet = useMemo(() => {
    if (mode === "en") return "qwertyuiopasdfghjklzxcvbnm".split("");
    return "أبتثجحخدذرزسشصضطظعغفقكلمنهويىة".split("");
  }, [mode]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    setBest(readScore("kalima"));
  }, []);

  const keyTone = useMemo(() => {
    const map = new Map<string, Tone>();
    guesses.forEach((word) => {
      scoreGuess(word, answer).forEach((tone, i) => {
        const ch = word[i]!;
        map.set(ch, rankTone(map.get(ch), tone)!);
      });
    });
    return map;
  }, [guesses, answer]);

  function deal(nextMode = mode) {
    const p = nextMode === "ar" ? [...AR_OK] : [...EN_OK];
    setMode(nextMode);
    setAnswer(p[Math.floor(Math.random() * p.length)]!);
    setGuesses([]);
    setCur("");
    setMsg("");
  }

  function submit(word: string) {
    const w = word.trim();
    if (w.length !== 5) {
      setMsg(L("خمس أحرف", "Five letters"));
      return;
    }
    const ok = mode === "ar" ? AR_OK.has(w) : EN_OK.has(w);
    if (!ok) {
      setMsg(L("ليست في القائمة", "Not in the list"));
      return;
    }
    const next = [...guesses, w];
    setGuesses(next);
    setCur("");
    setMsg("");
    if (w === answer) {
      const gained = 7 - next.length;
      setBest(writeScore("kalima", gained));
    }
  }

  function key(ch: string) {
    if (done) return;
    if (ch === "enter") return submit(cur);
    if (ch === "del") {
      setMsg("");
      return setCur((s) => s.slice(0, -1));
    }
    if (cur.length >= 5) return;
    setMsg("");
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
      if (e.key.length !== 1) return;
      const ch = mode === "en" ? e.key.toLowerCase() : e.key;
      if (mode === "en" && !/^[a-z]$/.test(ch)) return;
      if (mode === "ar" && !alphabet.includes(ch)) return;
      e.preventDefault();
      key(ch);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const rows = [...guesses, ...(done ? [] : [cur])];
  while (rows.length < 6) rows.push("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label={L("المحاولة", "Try")} value={`${guesses.length} / 6`} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
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
      <div className="relative mx-auto max-w-xs">
      <div className="grid gap-1.5">
        {rows.map((word, r) => {
          const tones = guesses[r] ? scoreGuess(guesses[r]!, answer) : null;
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
                    !tones && r === guesses.length && c === cur.length && "border-primary",
                  )}
                >
                  {word[c] ?? ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {done ? (
        <RoundOverlay
          title={won ? t(lang, "youWin") : t(lang, "gameOver")}
          detail={answer}
          actionLabel={t(lang, "newGame")}
          onAction={() => deal(mode)}
        />
      ) : null}
      </div>
      {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
      {!done ? (
        <p className="text-center text-xs text-subtle">{L("أدخل للكلمة — ⌫ للمسح", "Enter to submit — ⌫ to erase")}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-1">
        {alphabet.map((ch) => {
          const tone = keyTone.get(ch);
          return (
            <button
              key={ch}
              type="button"
              onClick={() => key(ch)}
              className={cn(
                "h-11 min-w-8 rounded-md border px-2 text-sm",
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
          {L("أدخل", "Enter")}
        </Button>
      </div>
    </div>
  );
}
