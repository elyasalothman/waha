import { useEffect, useState } from "react";
import { Flame, Globe, Heart, Moon, Music, Star, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const ICONS = [Sun, Moon, Star, Heart, Flame, Globe, Music, Zap] as const;

type Card = { id: number; icon: number; face: boolean; done: boolean };

function deal(): Card[] {
  const ids = [...ICONS.keys(), ...ICONS.keys()].sort(() => Math.random() - 0.5);
  return ids.map((icon, id) => ({ id, icon, face: false, done: false }));
}

export function MemoryApp() {
  const lang = useAppStore((s) => s.lang);
  const [cards, setCards] = useState<Card[]>(deal);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = usePersistent("waha:memory-best", 0);
  const lock = open.length === 2;
  const won = cards.every((c) => c.done) && cards.length > 0;

  useEffect(() => {
    if (won && moves > 0 && (best === 0 || moves < best)) setBest(moves);
  }, [won, moves, best, setBest]);

  function flip(i: number) {
    if (lock || cards[i]!.face || cards[i]!.done) return;
    const nextOpen = [...open, i];
    const next = cards.map((c, idx) => (idx === i ? { ...c, face: true } : c));
    setCards(next);
    if (nextOpen.length < 2) {
      setOpen(nextOpen);
      return;
    }
    setMoves((m) => m + 1);
    const a = next[nextOpen[0]!]!;
    const b = next[nextOpen[1]!]!;
    if (a.icon === b.icon) {
      setCards(next.map((c) => (c.icon === a.icon ? { ...c, done: true } : c)));
      setOpen([]);
    } else {
      setOpen(nextOpen);
      window.setTimeout(() => {
        setCards((cur) => cur.map((c, idx) => (nextOpen.includes(idx) ? { ...c, face: false } : c)));
        setOpen([]);
      }, 700);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label={lang === "ar" ? "الحركات" : "Moves"} value={moves} />
        <Stat label={t(lang, "best")} value={best || "—"} />
        <Button
          variant="secondary"
          onClick={() => {
            setCards(deal());
            setOpen([]);
            setMoves(0);
          }}
        >
          {t(lang, "newGame")}
        </Button>
      </div>
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
                "flex aspect-square items-center justify-center rounded-lg border",
                show ? "border-primary bg-surface-2 text-primary" : "border-border bg-surface text-transparent",
              )}
            >
              {show ? <Icon className="size-7" /> : <span className="size-7" />}
            </button>
          );
        })}
      </div>
      {won ? <p className="text-success">{t(lang, "youWin")}</p> : null}
    </div>
  );
}
