import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Kid = { id: string; name: string; amount: number };

export function EidiyaApp() {
  const lang = useAppStore((s) => s.lang);
  const [kids, setKids] = usePersistent<Kid[]>("waha:eidiya", []);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(50);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const total = useMemo(() => kids.reduce((s, k) => s + k.amount, 0), [kids]);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setKids([{ id: crypto.randomUUID(), name: name.trim(), amount }, ...kids]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("الاسم", "Name")} />
        <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <p className="font-display text-4xl tabular-nums">
        {total.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}
        <span className="ms-2 text-lg text-muted">{L("ريال", "SAR")}</span>
      </p>
      {kids.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف العيال ومبلغ كل واحد.", "Add the children and each amount.")}</p>
      ) : (
        <ul className="space-y-2">
          {kids.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <span>{k.name}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono tabular-nums">{k.amount}</span>
                <Button size="sm" variant="ghost" onClick={() => setKids(kids.filter((x) => x.id !== k.id))}>
                  {t(lang, "delete")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
