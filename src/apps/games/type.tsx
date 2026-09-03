import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const AR_TEXT =
  "العلم نور والجهل ظلام ومن سار على الدرب وصل والقناعة كنز لا يفنى والصبر مفتاح الفرج والعمل عبادة إذا أُحسنت النية والوقت كالسيف إن لم تقطعه قطعك والمرء مخبوء تحت لسانه";
const EN_TEXT =
  "Clear thinking is a craft. Short sentences carry weight. Practice every day and the hands remember what the mind forgets. Measure twice, cut once, then begin again with care.";

export function TypeApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<"ar" | "en">(lang);
  const source = mode === "ar" ? AR_TEXT : EN_TEXT;
  const [typed, setTyped] = useState("");
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

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

  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  const wpm = done || running ? Math.round((correct / 5) * (60 / Math.max(1, 60 - left))) : 0;
  const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;

  useEffect(() => {
    if (done) writeScore("type", wpm);
  }, [done, wpm]);

  function reset(next = mode) {
    setMode(next);
    setTyped("");
    setLeft(60);
    setRunning(false);
    setDone(false);
  }

  return (
    <div className="space-y-4">
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
        <Stat label={lang === "ar" ? "الوقت" : "Time"} value={left} />
        <Stat label="WPM" value={wpm} />
        <Stat label={lang === "ar" ? "الدقة" : "Accuracy"} value={`${acc}%`} />
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
        className="min-h-28 w-full rounded-lg border border-border bg-surface p-3 text-fg"
        dir={mode === "ar" ? "rtl" : "ltr"}
        disabled={done}
        value={typed}
        onChange={(e) => {
          if (!running && !done) setRunning(true);
          setTyped(e.target.value.slice(0, source.length));
        }}
        placeholder={lang === "ar" ? "ابدأ الكتابة هنا" : "Start typing here"}
      />
      {done ? <p className="text-sm text-muted">{words} {lang === "ar" ? "كلمة" : "words"}</p> : null}
    </div>
  );
}
