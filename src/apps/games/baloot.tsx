import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  newHand,
  scoreHand,
  matchScore,
  validGame,
  type Hand,
  type Projects,
  type SavedHand,
  type Team,
} from "@/lib/baloot";

const KEY = "waha:baloot:v2";
const emptyGame = () => ({ names: ["لنا", "لهم"] as [string, string], rounds: [] as SavedHand[] });
const projectNames: Record<keyof Projects, string> = {
  sara: "سرا",
  fifty: "خمسين",
  hundred: "مية",
  fourHundred: "أربعمية",
  baloot: "بلوت",
};
export function BalootApp() {
  const [game, setGame] = useState(emptyGame),
    [hand, setHand] = useState(newHand),
    [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [wide, setWide] = useState(false),
    [awake, setAwake] = useState(false),
    [reset, setReset] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = validGame(JSON.parse(raw));
        if (parsed) setGame(parsed);
        else setNotice("تعذّر استعادة اللعبة؛ البيانات المحفوظة غير صالحة.");
      }
    } catch {
      setNotice("التخزين غير متاح؛ ستبقى اللعبة لهذه الزيارة.");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(game));
    } catch {
      setNotice("تعذّر الحفظ على الجهاز؛ لا تغلق الصفحة قبل نهاية اللعب.");
    }
  }, [game, ready]);
  useEffect(() => {
    if (!wide) return;
    let cancelled = false;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          const next = await navigator.wakeLock.request("screen");
          if (cancelled) {
            await next.release();
            return;
          }
          lock = next;
          setAwake(true);
          next.addEventListener("release", () => setAwake(false));
        } else setNotice("إبقاء الشاشة مضاءة غير متاح في هذا المتصفح.");
      } catch {
        setNotice("تعذّر إبقاء الشاشة مضاءة؛ تحقق من إعدادات الجهاز.");
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
      setAwake(false);
    };
  }, [wide]);
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setWide(false);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const { totals, winner } = matchScore(game.rounds);
  let preview: ReturnType<typeof scoreHand> | null = null,
    error = "";
  try {
    preview = scoreHand(hand);
  } catch (e) {
    error = (e as Error).message;
  }
  const update = (patch: Partial<Hand>) => setHand((h) => ({ ...h, ...patch }));
  function save() {
    if (!preview || (!editing && winner !== null)) return;
    const round = { id: editing || crypto.randomUUID(), hand: structuredClone(hand) };
    setGame((g) => ({
      ...g,
      rounds: editing ? g.rounds.map((r) => (r.id === editing ? round : r)) : [...g.rounds, round],
    }));
    setHand(newHand());
    setEditing(null);
    setNotice(editing ? "تم تعديل الصكّة وإعادة حساب النشرة." : "حُفظت الصكّة.");
  }
  async function fullscreen() {
    if (wide) {
      setWide(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }
    setWide(true);
    try {
      await root.current?.requestFullscreen?.();
    } catch {
      setNotice("وضع موسّع مفعّل؛ ملء الشاشة غير مدعوم هنا.");
    }
  }
  return (
    <div
      ref={root}
      dir="rtl"
      className={`${wide ? "fixed inset-0 z-[100] overflow-y-auto bg-bg p-4 sm:p-8" : ""} space-y-5 baloot-board`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted">النشرة · الهدف ١٥٢</p>
          <h2 className="font-display text-2xl">
            الجمعة تحلى بالبلوت <span className="text-primary">♠</span>
          </h2>
        </div>
        <Button variant="outline" onClick={() => void fullscreen()}>
          {wide ? "تصغير" : "ملء الشاشة"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((i) => (
          <section
            key={i}
            className={`relative overflow-hidden rounded-2xl border p-4 sm:p-6 ${i === 0 ? "border-primary/30 bg-primary/10" : "border-border bg-surface"}`}
          >
            <label>
              <span className="sr-only">اسم فريق {i === 0 ? "لنا" : "لهم"}</span>
              <Input
                maxLength={30}
                value={game.names[i]}
                className="h-11 border-transparent bg-transparent text-center"
                onChange={(e) =>
                  setGame((g) => ({
                    ...g,
                    names: g.names.map((n, j) => (j === i ? e.target.value : n)) as [
                      string,
                      string,
                    ],
                  }))
                }
              />
            </label>
            <p
              data-testid={`score-${i}`}
              className="my-3 text-center font-display text-6xl tabular-nums"
            >
              {totals[i]}
            </p>
            <div className="h-1.5 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (totals[i] / 152) * 100)}%` }}
              />
            </div>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
        <span>{game.rounds.length} صكّات مسجّلة · حفظ محلي</span>
        {wide && <span>{awake ? "● الشاشة تبقى مضاءة" : "إضاءة الشاشة حسب دعم الجهاز"}</span>}
      </div>
      {winner !== null && (
        <div
          role="status"
          className="baloot-win rounded-2xl border border-primary/40 bg-primary/10 p-6 text-center"
        >
          <p className="text-3xl">✦ 🏆 ✦</p>
          <h3 className="mt-2 font-display text-3xl">
            الفوز لـ{game.names[winner] || (winner === 0 ? "لنا" : "لهم")}!
          </h3>
          <p className="mt-2 text-sm text-muted">
            مبروك الصكّة — تقدر تعدّل السجل أو تبدأ لعبة جديدة.
          </p>
        </div>
      )}
      {(winner === null || editing) && (
        <section className="space-y-5 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <h3 className="text-lg font-semibold">
            {editing ? "تعديل الصكّة" : "قيّد الصكّة التالية"}
          </h3>
          <fieldset>
            <legend className="mb-2 text-sm text-muted">نوع اللعب</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["hokom", "sun"] as const).map((mode) => (
                <Button
                  key={mode}
                  aria-pressed={hand.mode === mode}
                  variant={hand.mode === mode ? "default" : "outline"}
                  onClick={() => setHand({ ...newHand(), mode, raw: mode === "sun" ? 80 : 100 })}
                >
                  {mode === "sun" ? "صن ☀" : "حكم ♠"}
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm text-muted">المشتري</legend>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1] as const).map((i) => (
                <Button
                  key={i}
                  aria-pressed={hand.buyer === i}
                  variant={hand.buyer === i ? "secondary" : "outline"}
                  onClick={() => update({ buyer: i })}
                >
                  {game.names[i] || (i === 0 ? "لنا" : "لهم")}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              أبناط لنا (الخام)
              <Input
                aria-label="أبناط لنا"
                className="mt-2 h-12 text-xl"
                type="number"
                inputMode="numeric"
                min={0}
                max={hand.mode === "sun" ? 130 : 162}
                value={Number.isNaN(hand.raw) ? "" : hand.raw}
                onChange={(e) =>
                  update({ raw: e.target.value === "" ? NaN : Number(e.target.value) })
                }
              />
            </label>
            <div className="text-sm">
              أبناط لهم (تلقائي)
              <p className="mt-2 rounded-lg bg-bg p-3 text-xl tabular-nums">
                {Number.isFinite(hand.raw) ? (hand.mode === "sun" ? 130 : 162) - hand.raw : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[-10, -1, 1, 10].map((n) => (
              <Button
                key={n}
                variant="outline"
                aria-label={`${n > 0 ? "زيادة" : "نقص"} ${Math.abs(n)} أبناط`}
                onClick={() =>
                  update({
                    raw: Math.max(
                      0,
                      Math.min(hand.mode === "sun" ? 130 : 162, (hand.raw || 0) + n),
                    ),
                  })
                }
              >
                {n > 0 ? "+" : ""}
                {n}
              </Button>
            ))}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm text-muted">التدبيل</legend>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5] as const)
                .filter((n) => hand.mode === "hokom" || n < 3)
                .map((n) => (
                  <Button
                    key={n}
                    aria-pressed={hand.level === n}
                    variant={hand.level === n ? "default" : "outline"}
                    onClick={() => update({ level: n })}
                  >
                    {["", "عادي", "دبل", "ثري", "فور", "قهوة"][n]}
                  </Button>
                ))}
            </div>
            {hand.mode === "sun" && (
              <p className="mt-2 text-xs text-muted">
                دبل الصن: فريق ≤١٠٠ والآخر &gt;١٠٠ حسب اللائحة؛ تأكد من أهلية الفريقين قبل اختياره.
              </p>
            )}
          </fieldset>
          <details className="rounded-xl border border-border p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">
              المشاريع المعتمدة
            </summary>
            <p className="mb-3 text-xs leading-6 text-muted">
              أدخل المشاريع المفروشة للفريق صاحب المشروع الأكبر فقط. البلوت مستقل.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([0, 1] as const).map((i) => (
                <fieldset key={i} className="min-w-0">
                  <legend className="mb-2 font-semibold">{game.names[i]}</legend>
                  {(Object.keys(projectNames) as (keyof Projects)[])
                    .filter((k) => (hand.mode === "sun" ? k !== "baloot" : k !== "fourHundred"))
                    .map((k) => (
                      <label key={k} className="mb-3 block text-sm">
                        {projectNames[k]}
                        <select
                          className="mt-1 block h-11 w-full rounded-lg border border-border bg-bg px-2"
                          value={hand.projects[i][k]}
                          onChange={(e) => {
                            const p = structuredClone(hand.projects);
                            p[i][k] = Number(e.target.value);
                            update({ projects: p });
                          }}
                        >
                          {Array.from({ length: k === "baloot" ? 2 : 5 }, (_, n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                </fieldset>
              ))}
            </div>
          </details>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={hand.buyerLost}
              onChange={(e) => update({ buyerLost: e.target.checked, kaboot: null })}
            />
            خسران المشتري (قيد / تسجيل)
          </label>
          <label className="block text-sm">
            الكبوت — أخذ الأكلات الثمان
            <select
              aria-label="الكبوت"
              className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3"
              value={hand.kaboot === null ? "none" : hand.kaboot}
              onChange={(e) =>
                update({
                  kaboot: e.target.value === "none" ? null : (Number(e.target.value) as Team),
                  buyerLost: false,
                })
              }
            >
              <option value="none">بدون كبوت</option>
              <option value="0">كبوت لنا</option>
              <option value="1">كبوت لهم</option>
            </select>
          </label>
          <div aria-live="polite" className="rounded-xl bg-bg p-4 text-center">
            {error ? (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted">تُضاف للنشرة · لنا / لهم</p>
                <p
                  data-testid="hand-preview"
                  className="my-2 text-3xl font-semibold tabular-nums"
                  dir="ltr"
                >
                  {preview?.points[0]} / {preview?.points[1]}
                </p>
                <p className="text-xs text-muted">
                  {preview?.failed
                    ? "المشتري خسر؛ القيد للخصم"
                    : preview?.tied
                      ? "تعادل الأبناط"
                      : "حساب تلقائي مع المشاريع"}
                </p>
              </>
            )}
          </div>
          <Button disabled={!ready || !!error} className="h-12 w-full text-base" onClick={save}>
            {editing ? "حفظ التعديل" : "أضف الصكّة"}
          </Button>
          {editing && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setHand(newHand());
              }}
            >
              إلغاء التعديل
            </Button>
          )}
        </section>
      )}
      <p role="status" className="text-sm text-muted">
        {notice}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!game.rounds.length}
          onClick={() => {
            setGame((g) => ({ ...g, rounds: g.rounds.slice(0, -1) }));
            setEditing(null);
            setHand(newHand());
          }}
        >
          تراجع آخر صكّة
        </Button>
        <Button variant="outline" onClick={() => setReset(true)}>
          لعبة جديدة
        </Button>
      </div>
      {reset && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3">تمسح سجل اللعبة الحالية وتبدأ من صفر؟</p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setGame((g) => ({ ...g, rounds: [] }));
                setHand(newHand());
                setEditing(null);
                setReset(false);
              }}
            >
              نعم، ابدأ من صفر
            </Button>
            <Button variant="outline" onClick={() => setReset(false)}>
              احتفظ باللعبة
            </Button>
          </div>
        </div>
      )}
      <section>
        <h3 className="mb-3 text-lg font-semibold">سجل الصكّات</h3>
        {!game.rounds.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            النشرة فاضية… أول صكّة عليكم.
          </p>
        ) : (
          <ol className="space-y-2">
            {game.rounds.map((r, i) => {
              const result = scoreHand(r.hand);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3"
                >
                  <div>
                    <p className="text-sm">
                      {i + 1} · {r.hand.mode === "sun" ? "صن" : "حكم"} ·{" "}
                      {["", "عادي", "دبل", "ثري", "فور", "قهوة"][r.hand.level]}
                      {r.hand.kaboot !== null ? " · كبوت" : ""}
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      لنا {result.points[0]} · لهم {result.points[1]}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    aria-label={`تعديل الصكّة ${i + 1}`}
                    onClick={() => {
                      setEditing(r.id);
                      setHand(structuredClone(r.hand));
                      root.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    تعديل
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <details className="text-sm leading-7 text-muted">
        <summary className="min-h-11 cursor-pointer py-2">كيف نحسب؟ القواعد والمصدر</summary>
        <p>
          العدّ لغير المشتري ثم الباقي للمشتري. مشاريع الدبل ×٢، وفي الثري والفور بقيمتها الأصلية؛
          البلوت نقطتان. الكبوت ٢٥ حكم و٤٤ صن دون مضاعفة قيمة الكبوت. القهوة تنهي المباراة. أدخل
          المشاريع بعد حسم أفضليتها على الطاولة.
        </p>
        <a
          className="inline-flex min-h-11 items-center underline"
          href="https://enjoy.sa/media/j1ofreng/baloot.pdf"
          target="_blank"
          rel="noreferrer"
        >
          لائحة البلوت · الهيئة العامة للترفيه، البنود ٤–٧ ↗
        </a>
      </details>
    </div>
  );
}
