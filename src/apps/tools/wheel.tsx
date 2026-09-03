import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const DEFAULTS = ["نعم", "لا", "لاحقاً", "ربما", "اطلب رأياً", "ابدأ الآن"];

export function WheelApp() {
  const lang = useAppStore((s) => s.lang);
  const [opts, setOpts] = usePersistent<string[]>("waha:wheel", DEFAULTS);
  const [text, setText] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<string | null>(null);
  const angleRef = useRef(0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const n = Math.max(opts.length, 1);
  const slice = 360 / n;

  const gradient = useMemo(() => {
    const colors = ["var(--color-surface)", "var(--color-surface-2)"];
    const stops = opts.map((_, i) => {
      const c = colors[i % 2];
      return `${c} ${(i * slice).toFixed(2)}deg ${((i + 1) * slice).toFixed(2)}deg`;
    });
    return `conic-gradient(from -90deg, ${stops.join(", ")})`;
  }, [opts, slice]);

  function spin() {
    if (spinning || opts.length < 2) return;
    setSpinning(true);
    setLanded(null);
    const extra = 360 * (5 + Math.random() * 3);
    const target = angleRef.current + extra;
    angleRef.current = target;
    setAngle(target);
    window.setTimeout(() => {
      const deg = ((target % 360) + 360) % 360;
      const idx = Math.floor(((360 - deg) % 360) / slice) % opts.length;
      setLanded(opts[idx] ?? null);
      setSpinning(false);
    }, 3200);
  }

  return (
    <div className="space-y-5">
      <div className="relative mx-auto size-64">
        <div
          className="relative size-64 rounded-full border border-border shadow-(--shadow-soft)"
          style={{
            background: gradient,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "transform 3.2s cubic-bezier(0.12, 0.75, 0.12, 1)" : "none",
          }}
        >
          {opts.map((o, i) => {
            const mid = -90 + slice * i + slice / 2;
            return (
              <span
                key={`${o}-${i}`}
                className="pointer-events-none absolute left-1/2 top-1/2 w-20 -translate-x-1/2 text-center text-[11px] text-fg"
                style={{ transform: `rotate(${mid}deg) translateY(-5.4rem)` }}
              >
                {o}
              </span>
            );
          })}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 size-0 -translate-x-1/2 border-x-8 border-t-[18px] border-x-transparent border-t-primary" />
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg text-sm font-medium"
        >
          {L("أدر", "Spin")}
        </button>
      </div>
      {landed ? <p className="text-center font-display text-3xl">{landed}</p> : <p className="text-center text-sm text-muted">{L("أدر العجلة لتقرر.", "Spin the wheel to decide.")}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setOpts([...opts, text.trim()]);
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={L("خيار جديد", "New option")} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {opts.map((o, i) => (
          <li key={`${o}-${i}`}>
            <button
              type="button"
              onClick={() => setOpts(opts.filter((_, j) => j !== i))}
              className="rounded-full border border-border bg-surface px-3 py-1 text-sm hover:bg-surface-2"
            >
              {o}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
