import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Habit = { id: string; name: string; days: string[] };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function last7() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function streak(days: string[]) {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function HabitsApp() {
  const lang = useAppStore((s) => s.lang);
  const [habits, setHabits] = usePersistent<Habit[]>("waha:habits", []);
  const [name, setName] = useState("");
  const days = last7();

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setHabits([{ id: crypto.randomUUID(), name: name.trim(), days: [] }, ...habits]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "عادة جديدة" : "New habit"} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {habits.map((h) => (
        <div key={h.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-xs text-muted">{lang === "ar" ? "سلسلة" : "Streak"} {streak(h.days)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setHabits(habits.filter((x) => x.id !== h.id))}>
              {t(lang, "delete")}
            </Button>
          </div>
          <div className="flex gap-1">
            {days.map((d) => {
              const on = h.days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const next = on ? h.days.filter((x) => x !== d) : [...h.days, d];
                    setHabits(habits.map((x) => (x.id === h.id ? { ...x, days: next } : x)));
                  }}
                  className={cn("h-11 flex-1 rounded-md border text-[10px]", on ? "border-primary bg-primary text-primary-fg" : "border-border")}
                >
                  {d.slice(8)}
                </button>
              );
            })}
          </div>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            onClick={() => {
              const d = today();
              const next = h.days.includes(d) ? h.days : [...h.days, d];
              setHabits(habits.map((x) => (x.id === h.id ? { ...x, days: next } : x)));
            }}
          >
            {lang === "ar" ? "أنجزت اليوم" : "Done today"}
          </Button>
        </div>
      ))}
    </div>
  );
}
