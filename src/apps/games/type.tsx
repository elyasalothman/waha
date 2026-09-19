import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const AR_TEXT =
  "العلم نور والجهل ظلام ومن سار على الدرب وصل والقناعة كنز لا يفنى والصبر مفتاح الفرج والعمل عبادة إذا أُحسنت النية";
const EN_TEXT =
  "Clear thinking is a craft. Short sentences carry weight. Practice every day and the hands remember what the mind forgets.";

export function TypeApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"ar" | "en">(lang);
  const source = mode === "ar" ? AR_TEXT : EN_TEXT;
  const [typed, setTyped] = useState("");
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    setBest(readScore("type"));
  }, []);

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setDone(true);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, done]);

  const correct = useMemo(() => {
    let n = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === source[i]) n += 1;
    return n;
  }, [typed, source]);

  const elapsed = Math.max(1, 60 - left);
  const wpm = done || running ? Math.round((correct / 5) * (60 / elapsed)) : 0;
  const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;

  useEffect(() => {
    if (!done) return;
    setBest(writeScore("type", wpm));
  }, [done, wpm]);

  function reset(next = mode) {
    setMode(next);
    setTyped("");
    setLeft(60);
    setRunning(false);
    setDone(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onTyped(value: string) {
    const next = value.slice(0, source.length);
    if (!running && !done) setRunning(true);
    setTyped(next);
    if (next.length >= source.length) {
      setDone(true);
      setRunning(false);
    }
  }

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === "ar" ? "default" : "secondary"} onClick={() => reset("ar")}>
          العربية
        </Button>
        <Button size="sm" variant={mode === "en" ? "default" : "secondary"} onClick={() => reset("en")}>
          English
        </Button>
        <Button size="sm" variant="outline" onClick={() => reset(mode)}>
          {t(lang, "restart")}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={L("الوقت", "Time")} value={left} />
        <Stat label="WPM" value={wpm} />
        <Stat label={L("الدقة", "Accuracy")} value={`${acc}%`} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
      <p className="rounded-xl border border-border bg-surface p-4 text-lg leading-loose" dir={mode === "ar" ? "rtl" : "ltr"}>
        {source.split("").map((ch, i) => (
          <span
            key={i}
            className={cn(
              i < typed.length ? (typed[i] === ch ? "text-success" : "text-danger") : "text-muted",
              i === typed.length && "border-b border-primary",
            )}
          >
            {ch}
          </span>
        ))}
      </p>
      <textarea
        ref={inputRef}
        className="min-h-28 w-full rounded-lg border border-border bg-surface p-3 text-fg"
        dir={mode === "ar" ? "rtl" : "ltr"}
        disabled={done}
        value={typed}
        onChange={(e) => onTyped(e.target.value)}
        placeholder={L("ابدأ الكتابة هنا", "Start typing here")}
      />
      {done ? (
        <RoundOverlay
          title={L("انتهت الجولة", "Round over")}
          detail={L(`${wpm} كلمة/د · دقة ${acc}%`, `${wpm} WPM · ${acc}% accuracy`)}
          actionLabel={t(lang, "restart")}
          onAction={() => reset(mode)}
        />
      ) : null}
    </div>
  );
}
