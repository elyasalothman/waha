import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { EmergencyStrip } from "@/components/emergency-strip";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Person = { id: string; name: string; birthday: string };

function daysUntil(mmdd: string) {
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < now) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}

export function FamilyApp() {
  const lang = useAppStore((s) => s.lang);
  const [people, setPeople] = usePersistent<Person[]>("waha:family", []);
  const [name, setName] = useState("");
  const [month, setMonth] = useState("01");
  const [day, setDay] = useState("01");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const sorted = [...people].sort((a, b) => (daysUntil(a.birthday) ?? 99) - (daysUntil(b.birthday) ?? 99));

  return (
    <div className="space-y-4">
      <EmergencyStrip lang={lang} />
      <form
        className="grid gap-2 sm:grid-cols-[1fr_5rem_5rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setPeople([{ id: crypto.randomUUID(), name: name.trim(), birthday: `${month}-${day}` }, ...people]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("الاسم", "Name")} />
        <Input type="number" min={1} max={12} value={Number(month)} onChange={(e) => setMonth(String(e.target.value).padStart(2, "0"))} />
        <Input type="number" min={1} max={31} value={Number(day)} onChange={(e) => setDay(String(e.target.value).padStart(2, "0"))} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف أعياد ميلاد من تحب.", "Add birthdays of the people you love.")}</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((p) => {
            const d = daysUntil(p.birthday);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className={cn("text-sm tabular-nums", d === 0 ? "text-primary" : "text-muted")}>
                    {p.birthday}
                    {d == null ? "" : d === 0 ? ` · ${L("اليوم", "today")}` : ` · ${L(`بعد ${d} يوماً`, `in ${d} days`)}`}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPeople(people.filter((x) => x.id !== p.id))}>
                  {t(lang, "delete")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
