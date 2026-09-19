import { useEffect, useRef, useState } from "react";
import { Flame, Globe, Heart, Moon, Music, Star, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const ICONS = [Sun, Moon, Star, Heart, Flame, Globe, Music, Zap] as const;

type Card = { id: number; icon: number; face: boolean; done: boolean };
type Status = "idle" | "play" | "won";

function deal(): Card[] {
  const ids = [...ICONS.keys(), ...ICONS.keys()].sort(() => Math.random() - 0.5);
  return ids.map((icon, id) => ({ id, icon, face: false, done: false }));
}

export function MemoryApp() {
  const lang = useAppStore((s) => s.lang);
  const [status, setStatus] = useState<Status>("idle");
  const [cards, setCards] = useState<Card[]>(deal);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [best, setBest] = usePersistent("waha:memory-best", 0);
  const lock = open.length === 2;
  const ticking = useRef(false);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    ticking.current = status === "play";
  }, [status]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (ticking.current) setSecs((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  function start() {
    setCards(deal());
    setOpen([]);
    setMoves(0);
    setSecs(0);
    setStatus("play");
  }

  function flip(i: number) {
    if (status !== "play" || lock || cards[i]!.face || cards[i]!.done) return;
    const nextOpen = [...open, i];
    const next = cards.map((c, idx) => (idx === i ? { ...c, face: true } : c));
    setCards(next);
    if (nextOpen.length < 2) {
      setOpen(nextOpen);
      return;
    }
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const a = next[nextOpen[0]!]!;
    const b = next[nextOpen[1]!]!;
    if (a.icon === b.icon) {
      const done = next.map((c) => (c.icon === a.icon ? { ...c, done: true } : c));
      setCards(done);
      setOpen([]);
      if (done.every((c) => c.done)) {
        setStatus("won");
        if (best === 0 || nextMoves < best) setBest(nextMoves);
      }
    } else {
      setOpen(nextOpen);
      window.setTimeout(() => {
        setCards((cur) => cur.map((c, idx) => (nextOpen.includes(idx) ? { ...c, face: false } : c)));
        setOpen([]);
      }, 480);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={L("الحركات", "Moves")} value={moves} />
        <Stat label={L("الوقت", "Time")} value={secs} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
      <div className="relative">
        <div className="grid grid-cols-4 gap-2">
          {cards.map((c, i) => {
            const Icon = ICONS[c.icon]!;
            const show = c.face || c.done;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => flip(i)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border transition-colors duration-150",
                  show ? "border-primary bg-surface-2 text-primary" : "border-border bg-surface text-transparent hover:bg-surface-2",
                  c.done && "border-success/50",
                )}
              >
                {show ? <Icon className="size-7" /> : <span className="size-7" />}
              </button>
            );
          })}
        </div>
        {status !== "play" ? (
          <RoundOverlay
            title={status === "won" ? t(lang, "youWin") : L("الذاكرة", "Memory")}
            detail={
              status === "won"
                ? L(`${moves} حركة في ${secs} ثانية`, `${moves} moves in ${secs}s`)
                : L("اقلب بطاقتين واعثر على الأزواج.", "Flip two cards and find the pairs.")
            }
            actionLabel={status === "won" ? t(lang, "restart") : t(lang, "start")}
            onAction={start}
          />
        ) : null}
      </div>
      {status === "play" ? (
        <Button variant="outline" onClick={start}>
          {t(lang, "newGame")}
        </Button>
      ) : null}
    </div>
  );
}
