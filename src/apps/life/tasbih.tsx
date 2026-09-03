import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Phrase = { id: string; ar: string; en: string; target: number };

const PHRASES: Phrase[] = [
  { id: "subhan", ar: "سبحان الله", en: "Subhan Allah", target: 33 },
  { id: "hamd", ar: "الحمد لله", en: "Alhamdulillah", target: 33 },
  { id: "takbir", ar: "الله أكبر", en: "Allahu Akbar", target: 33 },
  { id: "tahlil", ar: "لا إله إلا الله", en: "La ilaha illa Allah", target: 100 },
  { id: "salawat", ar: "اللهم صل على محمد", en: "Allahumma salli ala Muhammad", target: 10 },
];

export function TasbihApp() {
  const lang = useAppStore((s) => s.lang);
  const [counts, setCounts] = usePersistent<Record<string, number>>("waha:tasbih", {});
  const [active, setActive] = usePersistent("waha:tasbih-active", "subhan");
  const phrase = PHRASES.find((p) => p.id === active) ?? PHRASES[0]!;
  const n = counts[phrase.id] ?? 0;

  function tap() {
    setCounts((prev) => ({ ...prev, [phrase.id]: (prev[phrase.id] ?? 0) + 1 }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PHRASES.map((p) => (
          <Button key={p.id} type="button" size="sm" variant={p.id === active ? "default" : "secondary"} onClick={() => setActive(p.id)}>
            {lang === "ar" ? p.ar : p.en}
          </Button>
        ))}
      </div>
      <Card className="flex flex-col items-center p-8">
        <p className="font-display text-3xl">{lang === "ar" ? phrase.ar : phrase.en}</p>
        <button
          type="button"
          onClick={tap}
          className="mt-6 flex size-44 items-center justify-center rounded-full border border-border bg-surface-2 font-mono text-5xl tabular-nums text-primary"
        >
          {n}
        </button>
        <p className="mt-4 text-sm text-muted">
          {lang === "ar" ? `الهدف ${phrase.target}` : `Goal ${phrase.target}`}
        </p>
        <Button
          className="mt-4"
          variant="ghost"
          onClick={() => setCounts((prev) => ({ ...prev, [phrase.id]: 0 }))}
        >
          {lang === "ar" ? "تصفير" : "Reset"}
        </Button>
      </Card>
    </div>
  );
}
