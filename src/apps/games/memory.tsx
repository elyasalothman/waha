import { useEffect, useState } from "react";
import { Droplets, Moon, Palmtree, Star, Sun, Tent, Wind, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { usePersistent, writeBestMin } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const ICONS = [Sun, Moon, Star, Palmtree, Droplets, Tent, Wind, BookOpen] as const;

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
    if (won && moves > 0 && (best === 0 || moves < best)) {
      setBest(moves);
      writeBestMin("memory", moves);
      playSfx("win");
    }
  }, [won, moves, best, setBest]);

  function flip(i: number) {
    if (lock || cards[i]!.face || cards[i]!.done) return;
    playSfx("tap");
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
      playSfx("ok");
      setCards(next.map((c) => (c.icon === a.icon ? { ...c, done: true } : c)));
      setOpen([]);
    } else {
      playSfx("miss");
      setOpen(nextOpen);
      window.setTimeout(() => {
        setCards((cur) => cur.map((c, idx) => (nextOpen.includes(idx) ? { ...c, face: false } : c)));
        setOpen([]);
      }, 560);
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
                "flex aspect-square items-center justify-center rounded-lg border transition-[transform,background-color] duration-200 ease-out active:scale-[0.97] touch-manipulation",
                show ? "border-primary/50 bg-surface-2 text-primary" : "border-border bg-surface-2 text-subtle/40",
                c.done && "border-success/50 bg-success/10 text-success",
              )}
              aria-label={show ? (lang === "ar" ? "مكشوف" : "Open") : lang === "ar" ? "ورقة" : "Card"}
            >
              {show ? <Icon className="size-7" strokeWidth={1.6} /> : <span className="size-1.5 rounded-full bg-subtle/50" />}
            </button>
          );
        })}
      </div>
      {won ? <p className="text-success">{t(lang, "youWin")}</p> : null}
    </div>
  );
}
