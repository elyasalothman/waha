import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Store = { date: string; n: number; goal: number };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function WaterApp() {
  const lang = useAppStore((s) => s.lang);
  const [s, setS] = usePersistent<Store>("waha:water", { date: today(), n: 0, goal: 8 });
  const n = s.date === today() ? s.n : 0;
  const goal = s.goal || 8;

  function set(n0: number) {
    setS({ date: today(), n: Math.max(0, n0), goal });
  }

  return (
    <div className="space-y-5">
      <p className="font-display text-5xl tabular-nums">
        {n}
        <span className="text-2xl text-muted"> / {goal}</span>
      </p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: goal }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => set(i + 1 === n ? i : i + 1)}
            className={cn("h-10 w-10 rounded-full border", i < n ? "border-primary bg-primary" : "border-border bg-surface")}
            aria-label={`${i + 1}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => set(n + 1)}>{lang === "ar" ? "كوب" : "Glass"}</Button>
        <Button variant="secondary" onClick={() => set(0)}>
          {lang === "ar" ? "تصفير اليوم" : "Reset today"}
        </Button>
      </div>
      <label className="block max-w-40 text-sm">
        <span className="mb-1 block text-muted">{lang === "ar" ? "الهدف" : "Goal"}</span>
        <Input
          type="number"
          min={4}
          max={16}
          value={goal}
          onChange={(e) => setS({ date: today(), n, goal: Number(e.target.value) || 8 })}
        />
      </label>
    </div>
  );
}
