import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Med = { id: string; name: string; dose: string; times: number };
type Store = { meds: Med[]; taken: Record<string, string[]> };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MedsApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:meds", { meds: [], taken: {} });
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState("1");
  const key = today();
  const taken = store.taken[key] ?? [];
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function mark(id: string, slot: number) {
    const token = `${id}:${slot}`;
    const next = taken.includes(token) ? taken.filter((x) => x !== token) : [...taken, token];
    setStore({ ...store, taken: { ...store.taken, [key]: next } });
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_7rem_5rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Math.min(6, Math.max(1, Number(times) || 1));
          if (!name.trim()) return;
          setStore({
            ...store,
            meds: [{ id: crypto.randomUUID(), name: name.trim(), dose: dose.trim(), times: n }, ...store.meds],
          });
          setName("");
          setDose("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("اسم الدواء", "Medicine")} />
        <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder={L("الجرعة", "Dose")} />
        <Input type="number" min={1} max={6} value={times} onChange={(e) => setTimes(e.target.value)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {store.meds.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف أدويتك اليومية وعلّم كل جرعة.", "Add daily medicines and tick each dose.")}</p>
      ) : (
        <ul className="space-y-3">
          {store.meds.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  {m.dose ? <p className="text-xs text-muted">{m.dose}</p> : null}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setStore({ ...store, meds: store.meds.filter((x) => x.id !== m.id) })}>
                  {t(lang, "delete")}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: m.times }, (_, i) => {
                  const on = taken.includes(`${m.id}:${i}`);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => mark(m.id, i)}
                      className={cn(
                        "h-11 min-w-11 rounded-md border px-3 text-sm",
                        on ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface-2",
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
