import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Person = { id: string; name: string };

export function SplitApp() {
  const lang = useAppStore((s) => s.lang);
  const [total, setTotal] = usePersistent("waha:split-total", 120);
  const [people, setPeople] = usePersistent<Person[]>("waha:split-people", [
    { id: "a", name: lang === "ar" ? "أنا" : "Me" },
    { id: "b", name: lang === "ar" ? "صديق" : "Friend" },
  ]);
  const [name, setName] = useState("");
  const each = useMemo(() => (people.length ? total / people.length : 0), [total, people.length]);

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{lang === "ar" ? "إجمالي الفاتورة" : "Bill total"}</span>
        <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value) || 0)} />
      </label>
      <p className="font-display text-4xl tabular-nums">
        {each.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 2 })}
        <span className="ms-2 text-lg text-muted">{lang === "ar" ? "للشخص" : "each"}</span>
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setPeople([...people, { id: crypto.randomUUID(), name: name.trim() }]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "اسم" : "Name"} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
            <span>{p.name}</span>
            <Button size="sm" variant="ghost" onClick={() => setPeople(people.filter((x) => x.id !== p.id))}>
              {t(lang, "delete")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
